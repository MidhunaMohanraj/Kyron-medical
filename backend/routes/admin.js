const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

// GET /api/admin/doctors - List all doctors
router.get('/doctors', async (req, res) => {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH /api/admin/doctors/:id - Update doctor active status
router.patch('/doctors/:id', async (req, res) => {
  const { active } = req.body;
  const { data, error } = await supabase
    .from('doctors')
    .update({ active })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/admin/slots/:doctorId - Get slots for a doctor
router.get('/slots/:doctorId', async (req, res) => {
  const { data, error } = await supabase
    .from('availability_slots')
    .select('*')
    .eq('doctor_id', req.params.doctorId)
    .gte('slot_datetime', new Date().toISOString())
    .order('slot_datetime')
    .limit(50);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/admin/slots - Add a new slot
router.post('/slots', async (req, res) => {
  const { doctor_id, slot_datetime } = req.body;
  if (!doctor_id || !slot_datetime) {
    return res.status(400).json({ error: 'doctor_id and slot_datetime are required' });
  }
  const { data, error } = await supabase
    .from('availability_slots')
    .insert({ doctor_id, slot_datetime })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/admin/slots/:id - Remove a slot
router.delete('/slots/:id', async (req, res) => {
  const { error } = await supabase
    .from('availability_slots')
    .delete()
    .eq('id', req.params.id)
    .eq('is_booked', false); // Can't delete booked slots
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// GET /api/admin/appointments - List upcoming appointments
router.get('/appointments', async (req, res) => {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      patients (first_name, last_name, email, phone),
      doctors (name, specialty)
    `)
    .order('appointment_datetime', { ascending: true })
    .limit(50);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH /api/admin/appointments/:id - Update appointment status
router.patch('/appointments/:id', async (req, res) => {
  const { status } = req.body;
  const { data, error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
