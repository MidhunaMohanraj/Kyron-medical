import { useState, useEffect, useCallback } from 'react';
import { sendMessage, loadConversation } from '../utils/api';

const SESSION_KEY = 'kyron_session_id';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const existingSession = localStorage.getItem(SESSION_KEY);
    if (existingSession) {
      restoreSession(existingSession);
    } else {
      setIsRestoring(false);
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Hi! I'm Aria, your Kyron Medical assistant. I can help you schedule an appointment, check prescription refill status, or answer questions about our practice.\n\nHow can I help you today?",
        timestamp: new Date().toISOString()
      }]);
    }
  }, []);

  async function restoreSession(sid) {
    try {
      setIsRestoring(true);
      const conv = await loadConversation(sid);
      if (conv?.messages?.length) {
        setSessionId(sid);
        setMessages(conv.messages.map((m, i) => ({ ...m, id: `restored-${i}` })));
      } else {
        localStorage.removeItem(SESSION_KEY);
        setIsRestoring(false);
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: "Hi! I'm Aria, your Kyron Medical assistant. How can I help you today?",
          timestamp: new Date().toISOString()
        }]);
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Hi! I'm Aria, your Kyron Medical assistant. How can I help you today?",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsRestoring(false);
    }
  }

  const send = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const result = await sendMessage(text, sessionId);

      if (result.sessionId && result.sessionId !== sessionId) {
        setSessionId(result.sessionId);
        localStorage.setItem(SESSION_KEY, result.sessionId);
      }

      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.response,
        timestamp: new Date().toISOString()
      }]);
    } catch (err) {
      const errMessage = err.response?.data?.error || 'Something went wrong. Please try again.';
      setError(errMessage);
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `I'm sorry, I encountered an error: ${errMessage}`,
        timestamp: new Date().toISOString(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isLoading]);

  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setSessionId(null);
    setError(null);
    setMessages([{
      id: `welcome-${Date.now()}`,
      role: 'assistant',
      content: "Hi! I'm Aria, your Kyron Medical assistant. How can I help you today?",
      timestamp: new Date().toISOString()
    }]);
  }, []);

  return { messages, sessionId, isLoading, isRestoring, error, send, clearSession };
}