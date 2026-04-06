const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendAppointmentConfirmation({ patient, doctor, appointment, slot }) {
  const appointmentDate = new Date(appointment.appointment_datetime);
  const dateStr = appointmentDate.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const timeStr = appointmentDate.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #f4f7fb; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #1a56db, #0e9f6e); padding: 32px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; }
        .body { padding: 32px; }
        .card { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 16px 0; border-left: 4px solid #1a56db; }
        .card h3 { margin: 0 0 12px; color: #1e2a3a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
        .detail { display: flex; margin: 8px 0; }
        .detail .label { color: #6b7280; width: 130px; flex-shrink: 0; font-size: 14px; }
        .detail .value { color: #1e2a3a; font-weight: 600; font-size: 14px; }
        .footer { background: #f8fafc; padding: 24px; text-align: center; }
        .footer p { color: #9ca3af; font-size: 12px; margin: 4px 0; }
        .badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 Kyron Medical</h1>
          <p>Appointment Confirmation</p>
        </div>
        <div class="body">
          <span class="badge">✓ Confirmed</span>
          <p style="color:#374151; font-size:15px;">Dear ${patient.first_name} ${patient.last_name},</p>
          <p style="color:#374151; font-size:15px;">Your appointment has been successfully scheduled. Here are your details:</p>

          <div class="card">
            <h3>Appointment Details</h3>
            <div class="detail"><span class="label">Date</span><span class="value">${dateStr}</span></div>
            <div class="detail"><span class="label">Time</span><span class="value">${timeStr}</span></div>
            <div class="detail"><span class="label">Doctor</span><span class="value">${doctor.name}</span></div>
            <div class="detail"><span class="label">Specialty</span><span class="value">${doctor.specialty}</span></div>
            <div class="detail"><span class="label">Reason</span><span class="value">${appointment.reason}</span></div>
          </div>

          <div class="card">
            <h3>Your Information</h3>
            <div class="detail"><span class="label">Name</span><span class="value">${patient.first_name} ${patient.last_name}</span></div>
            <div class="detail"><span class="label">Phone</span><span class="value">${patient.phone}</span></div>
            <div class="detail"><span class="label">Email</span><span class="value">${patient.email}</span></div>
          </div>

          <p style="color:#6b7280; font-size:13px; margin-top:24px;">
            Please arrive 15 minutes early to complete any necessary paperwork. If you need to reschedule or cancel, please contact us at least 24 hours in advance.
          </p>
        </div>
        <div class="footer">
          <p>Kyron Medical | Powered by AI Patient Assistant</p>
          <p>This is an automated confirmation. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'appointments@kyronmedical.com',
      to: patient.email,
      subject: `Appointment Confirmed: ${dateStr} at ${timeStr} with ${doctor.name}`,
      html
    });
    console.log('Email sent:', result);
    return result;
  } catch (err) {
    console.error('Email send error:', err);
    throw err;
  }
}

module.exports = { sendAppointmentConfirmation };
