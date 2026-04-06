const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getConversationMessages } = require('../services/conversationService');
require('dotenv').config();

router.post('/call', async (req, res) => {
  try {
    const { phoneNumber, sessionId } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    let contextMessage = '';
    if (sessionId) {
      const conv = await getConversationMessages(sessionId);
      if (conv?.messages?.length) {
        const recent = conv.messages.slice(-6);
        contextMessage = recent.map(m => `${m.role === 'user' ? 'Patient' : 'Aria'}: ${m.content}`).join('\n');
      }
    }

    const firstMessage = contextMessage
      ? `Hi! This is Aria from Kyron Medical continuing your web chat. Here's a quick summary of where we left off: ${contextMessage.slice(0, 200)}. How can I help you?`
      : `Hi! This is Aria from Kyron Medical. How can I help you today?`;

    const vapiResponse = await axios.post(
      'https://api.vapi.ai/call/phone',
      {
        phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
        assistantId: process.env.VAPI_ASSISTANT_ID,
        assistantOverrides: {
          firstMessage
        },
        customer: {
          number: phoneNumber
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      callId: vapiResponse.data.id,
      message: `Calling ${phoneNumber}. You will receive a call shortly.`
    });
  } catch (err) {
    console.error('Vapi error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.message || err.message });
  }
});

router.post('/webhook', async (req, res) => {
  res.json({ received: true });
});

module.exports = router;