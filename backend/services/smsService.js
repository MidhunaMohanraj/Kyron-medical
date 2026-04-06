const twilio = require('twilio');
require('dotenv').config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendAppointmentSMS({ patient, doctor, appointment }) {
  if (!patient.sms_opted_in) {
    console.log('Patient has not opted in to SMS');
    return null;
  }

  const appointmentDate = new Date(appointment.appointment_datetime);
  const dateStr = appointmentDate.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  });
  const timeStr = appointmentDate.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true
  });

  const message = `Kyron Medical: Hi ${patient.first_name}! Your appointment with ${doctor.name} is confirmed for ${dateStr} at ${timeStr}. Reason: ${appointment.reason}. Reply STOP to opt out.`;

  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: patient.phone
    });
    console.log('SMS sent:', result.sid);
    return result;
  } catch (err) {
    console.error('SMS send error:', err);
    // Don't throw - SMS failure shouldn't break booking
    return null;
  }
}

async function sendSMSOptInConfirmation(phone, firstName) {
  const message = `Kyron Medical: Hi ${firstName}! You've opted in to receive appointment reminders via SMS. Reply STOP at any time to unsubscribe.`;
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
    return result;
  } catch (err) {
    console.error('SMS opt-in error:', err);
    return null;
  }
}

module.exports = { sendAppointmentSMS, sendSMSOptInConfirmation };
