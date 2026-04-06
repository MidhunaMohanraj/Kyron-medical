const supabase = require('../db/supabase');

async function getOrCreateConversation(sessionId) {
  // Try to find existing
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (existing) {
    // Update last activity
    await supabase
      .from('conversations')
      .update({ last_activity: new Date().toISOString() })
      .eq('session_id', sessionId);
    return existing;
  }

  // Create new
  const { data: created, error } = await supabase
    .from('conversations')
    .insert({ session_id: sessionId, messages: [], channel: 'web' })
    .select()
    .single();

  if (error) throw error;
  return created;
}

async function appendMessage(sessionId, role, content) {
  const conv = await getOrCreateConversation(sessionId);
  const messages = conv.messages || [];
  messages.push({ role, content, timestamp: new Date().toISOString() });

  const { error } = await supabase
    .from('conversations')
    .update({ messages, last_activity: new Date().toISOString() })
    .eq('session_id', sessionId);

  if (error) throw error;
  return messages;
}

async function updateConversationState(sessionId, updates) {
  const { error } = await supabase
    .from('conversations')
    .update({ ...updates, last_activity: new Date().toISOString() })
    .eq('session_id', sessionId);

  if (error) throw error;
}

async function getConversationMessages(sessionId) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (error) return null;
  return data;
}

module.exports = {
  getOrCreateConversation,
  appendMessage,
  updateConversationState,
  getConversationMessages
};
