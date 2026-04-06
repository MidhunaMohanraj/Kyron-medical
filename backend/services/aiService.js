const Groq = require('groq-sdk');
const supabase = require('../db/supabase');
const { matchDoctorToReason, getAvailableSlots, getSlotsByDayOfWeek, formatSlotsForAI } = require('./doctorService');
const { sendAppointmentConfirmation } = require('./emailService');
const { sendAppointmentSMS } = require('./smsService');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are Aria, a warm professional AI patient assistant for Kyron Medical. Help patients schedule appointments and answer practice questions.

PRACTICE INFO:
- Address: 123 Medical Drive Suite 400 San Francisco CA 94105
- Hours: Monday-Friday 8am-5pm Saturday 9am-1pm Closed Sunday
- Phone: 415-555-0100
- Providers: Dr. Sarah Chen Orthopedics, Dr. Marcus Webb Cardiology, Dr. Priya Patel Dermatology, Dr. James Okafor Neurology

WORKFLOW - follow exactly:
1. Collect FULL NAME
2. Collect DATE OF BIRTH
3. Collect PHONE NUMBER
4. Collect EMAIL
5. Collect REASON FOR VISIT
6. Call match_doctor_to_reason - use the doctor_id from the result
7. Call get_available_slots with that exact doctor_id
8. Show numbered list to patient
9. When patient picks a number, call book_appointment immediately with all collected info
10. Confirm booking and say email was sent

CRITICAL RULES:
- sms_opted_in must always be boolean false unless patient explicitly asks for SMS
- doctor_id must be the UUID returned by match_doctor_to_reason, never a name
- slot_id must be the UUID from the slot list
- Never show raw JSON or function calls to the user
- Never invent IDs
- Call book_appointment immediately when patient selects a slot number

SAFETY: Never provide medical advice. Call 911 for emergencies. If condition does not match providers say we do not treat that condition.`;

const tools = [
  {
    type: 'function',
    function: {
      name: 'match_doctor_to_reason',
      description: 'Match patient reason for visit to the best doctor. Returns doctor_id UUID to use in subsequent calls.',
      parameters: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'Patient reason for visit' }
        },
        required: ['reason']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_available_slots',
      description: 'Get available appointment slots for a doctor using their UUID.',
      parameters: {
        type: 'object',
        properties: {
          doctor_id: { type: 'string', description: 'Doctor UUID from match_doctor_to_reason' },
          limit: { type: 'number', description: 'Number of slots, default 5' }
        },
        required: ['doctor_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_slots_by_day',
      description: 'Get slots for a doctor on a specific day of week.',
      parameters: {
        type: 'object',
        properties: {
          doctor_id: { type: 'string' },
          day_of_week: { type: 'string', description: 'e.g. monday tuesday wednesday' }
        },
        required: ['doctor_id', 'day_of_week']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'book_appointment',
      description: 'Book appointment. Call this immediately when patient selects a slot. Use exact UUIDs for doctor_id and slot_id.',
      parameters: {
        type: 'object',
        properties: {
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          dob: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string' },
          sms_opted_in: { type: 'boolean', description: 'Must be boolean true or false, never a string' },
          doctor_id: { type: 'string', description: 'UUID from match_doctor_to_reason' },
          slot_id: { type: 'string', description: 'UUID from get_available_slots' },
          reason: { type: 'string' }
        },
        required: ['first_name', 'last_name', 'dob', 'phone', 'email', 'doctor_id', 'slot_id', 'reason']
      }
    }
  }
];

async function executeTool(toolName, toolInput) {
  try {
    switch (toolName) {
      case 'match_doctor_to_reason': {
        const result = await matchDoctorToReason(toolInput.reason);
        if (!result.doctor) return { matched: false, message: 'No matching doctor found for this condition.' };
        return {
          matched: true,
          doctor_id: result.doctor.id,
          doctor_name: result.doctor.name,
          specialty: result.doctor.specialty,
          bio: result.doctor.bio
        };
      }

      case 'get_available_slots': {
        const slots = await getAvailableSlots(toolInput.doctor_id, { limit: toolInput.limit || 5 });
        return {
          slots_count: slots.length,
          formatted: formatSlotsForAI(slots),
          slots: slots.map(s => ({ id: s.id, datetime: s.slot_datetime }))
        };
      }

      case 'get_slots_by_day': {
        const slots = await getSlotsByDayOfWeek(toolInput.doctor_id, toolInput.day_of_week);
        if (!slots.length) return { slots_count: 0, message: 'No slots on that day.' };
        return {
          slots_count: slots.length,
          formatted: formatSlotsForAI(slots),
          slots: slots.map(s => ({ id: s.id, datetime: s.slot_datetime }))
        };
      }

      case 'book_appointment': {
        const { first_name, last_name, dob, phone, email, doctor_id, slot_id, reason } = toolInput;
        const smsOpted = toolInput.sms_opted_in === true;

        console.log('BOOKING:', { first_name, last_name, email, doctor_id, slot_id });

        const { data: slot } = await supabase
          .from('availability_slots')
          .select('*')
          .eq('id', slot_id)
          .eq('is_booked', false)
          .single();

        if (!slot) return { success: false, error: 'That slot is no longer available. Please choose another time.' };

        let patient;
        const { data: existing } = await supabase.from('patients').select('*').eq('email', email).single();
        if (existing) {
          const { data: updated } = await supabase.from('patients')
            .update({ first_name, last_name, dob, phone, sms_opted_in: smsOpted })
            .eq('id', existing.id).select().single();
          patient = updated;
        } else {
          const { data: created, error: ce } = await supabase.from('patients')
            .insert({ first_name, last_name, dob, phone, email, sms_opted_in: smsOpted })
            .select().single();
          if (ce) return { success: false, error: 'Failed to create patient: ' + ce.message };
          patient = created;
        }

        const { data: doctor } = await supabase.from('doctors').select('*').eq('id', doctor_id).single();
        if (!doctor) return { success: false, error: 'Doctor not found.' };

        const { data: appointment, error: ae } = await supabase.from('appointments')
          .insert({
            patient_id: patient.id,
            doctor_id: doctor.id,
            slot_id,
            reason,
            appointment_datetime: slot.slot_datetime,
            status: 'confirmed'
          })
          .select().single();

        if (ae) return { success: false, error: 'Failed to create appointment: ' + ae.message };

        await supabase.from('availability_slots').update({ is_booked: true }).eq('id', slot_id);

        try {
          await sendAppointmentConfirmation({ patient, doctor, appointment, slot });
          console.log('Email sent to:', patient.email);
        } catch (e) {
          console.error('Email failed:', e.message);
        }

        if (smsOpted) {
          try { await sendAppointmentSMS({ patient, doctor, appointment }); } catch (e) { console.error('SMS failed:', e.message); }
        }

        const d = new Date(appointment.appointment_datetime);
        return {
          success: true,
          doctor_name: doctor.name,
          formatted_date: d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Los_Angeles' }),
          formatted_time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' }),
          email_sent: true,
          confirmation_sent_to: patient.email
        };
      }

      default:
        return { error: 'Unknown tool' };
    }
  } catch (err) {
    console.error('TOOL ERROR:', err);
    return { error: err.message };
  }
}

async function chat(messages) {
  const apiMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }))
  ];

  let response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: apiMessages,
    tools,
    tool_choice: 'auto',
    max_tokens: 1024,
    parallel_tool_calls: false
  });

  let message = response.choices[0].message;

  while (message.tool_calls && message.tool_calls.length > 0) {
    apiMessages.push(message);
    for (const tc of message.tool_calls) {
      const result = await executeTool(tc.function.name, JSON.parse(tc.function.arguments));
      console.log('Tool:', tc.function.name, '→', result);
      apiMessages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(result)
      });
    }

    response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: apiMessages,
      tools,
      tool_choice: 'auto',
      max_tokens: 1024,
      parallel_tool_calls: false
    });

    message = response.choices[0].message;
  }

  return message.content;
}

module.exports = { chat };