const express = require('express');
const router = express.Router();
const { chat } = require('../services/aiService');
const { getOrCreateConversation, appendMessage, getConversationMessages } = require('../services/conversationService');
const { v4: uuidv4 } = require('uuid');

// POST /api/chat - Send a message
router.post('/', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create session
    const sid = sessionId || uuidv4();
    const conversation = await getOrCreateConversation(sid);

    // Append user message
    const messages = await appendMessage(sid, 'user', message);

    // Get AI response (pass full history)
    const aiMessages = messages.map(m => ({ role: m.role, content: m.content }));
    const aiResponse = await chat(aiMessages, sid);

    // Append assistant response
    await appendMessage(sid, 'assistant', aiResponse);

    res.json({
      sessionId: sid,
      response: aiResponse
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message || 'Failed to process message. Please try again.' });
  }
});

// GET /api/chat/:sessionId - Get conversation history (for session restore)
router.get('/:sessionId', async (req, res) => {
  try {
    const conv = await getConversationMessages(req.params.sessionId);
    if (!conv) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(conv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load conversation' });
  }
});

module.exports = router;
