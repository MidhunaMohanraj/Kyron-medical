import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
});

export async function sendMessage(message, sessionId) {
  const { data } = await api.post('/chat', { message, sessionId });
  return data; // { sessionId, response }
}

export async function loadConversation(sessionId) {
  const { data } = await api.get(`/chat/${sessionId}`);
  return data;
}

export async function initiateVoiceCall(phoneNumber, sessionId) {
  const { data } = await api.post('/voice/call', { phoneNumber, sessionId });
  return data;
}

// Admin
export async function getDoctors() {
  const { data } = await api.get('/admin/doctors');
  return data;
}

export async function updateDoctorStatus(doctorId, active) {
  const { data } = await api.patch(`/admin/doctors/${doctorId}`, { active });
  return data;
}

export async function getDoctorSlots(doctorId) {
  const { data } = await api.get(`/admin/slots/${doctorId}`);
  return data;
}

export async function addSlot(doctorId, slotDatetime) {
  const { data } = await api.post('/admin/slots', { doctor_id: doctorId, slot_datetime: slotDatetime });
  return data;
}

export async function deleteSlot(slotId) {
  const { data } = await api.delete(`/admin/slots/${slotId}`);
  return data;
}

export async function getAppointments() {
  const { data } = await api.get('/admin/appointments');
  return data;
}

export async function updateAppointmentStatus(appointmentId, status) {
  const { data } = await api.patch(`/admin/appointments/${appointmentId}`, { status });
  return data;
}
