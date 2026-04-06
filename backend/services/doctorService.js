const supabase = require('../db/supabase');

/**
 * Semantically matches a patient's complaint to the best doctor.
 */
async function matchDoctorToReason(reason) {
  const { data: doctors, error } = await supabase
    .from('doctors')
    .select('*')
    .eq('active', true);

  if (error || !doctors?.length) return { doctor: null, confidence: 0 };

  const reasonLower = reason.toLowerCase();
  const reasonWords = reasonLower.split(/\s+/);

  let bestDoctor = null;
  let bestScore = 0;

  for (const doctor of doctors) {
    const keywords = doctor.body_part.split(',').map(k => k.trim().toLowerCase());
    let score = 0;

    for (const keyword of keywords) {
      if (reasonLower.includes(keyword)) {
        score += keyword.split(' ').length;
      }
    }

    for (const word of reasonWords) {
      for (const keyword of keywords) {
        if (keyword.includes(word) && word.length > 3) {
          score += 0.5;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestDoctor = doctor;
    }
  }

  return {
    doctor: bestScore > 0 ? bestDoctor : null,
    confidence: bestScore
  };
}

/**
 * Get available slots
 */
async function getAvailableSlots(doctorId, options = {}) {
  let query = supabase
    .from('availability_slots')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('is_booked', false)
    .gte('slot_datetime', new Date().toISOString())
    .order('slot_datetime', { ascending: true });

  query = query.limit(options.limit || 5); // ✅ ALWAYS limit to 5 (IMPORTANT FIX)

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Get slots by day
 */
async function getSlotsByDayOfWeek(doctorId, dayOfWeek) {
  const slots = await getAvailableSlots(doctorId, { limit: 20 });

  const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const targetDay = typeof dayOfWeek === 'string'
    ? dayNames.indexOf(dayOfWeek.toLowerCase())
    : dayOfWeek;

  return slots
    .filter(slot => new Date(slot.slot_datetime).getDay() === targetDay)
    .slice(0, 5);
}

/**
 * Format slots for AI
 */
function formatSlotsForAI(slots) {
  if (!slots?.length) return 'No available slots found.';

  return slots.map((slot, i) => {
    const d = new Date(slot.slot_datetime);

    const dateStr = d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const timeStr = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // ✅ CRITICAL: keep numbering EXACT and consistent
    return `${i + 1}. ${dateStr} at ${timeStr} (slot_id: ${slot.id})`;
  }).join('\n');
}

module.exports = {
  matchDoctorToReason,
  getAvailableSlots,
  getSlotsByDayOfWeek,
  formatSlotsForAI
};