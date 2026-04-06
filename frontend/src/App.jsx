import React, { useState, useRef, useEffect } from 'react';
import { Phone, Send, Loader2, ShieldCheck } from 'lucide-react';
import { useChat } from './hooks/useChat';
import ChatMessage from './components/ChatMessage';
import TypingIndicator from './components/TypingIndicator';
import VoiceCallModal from './components/VoiceCallModal';
import QuickReplies from './components/QuickReplies';

export default function App() {
  const { messages, sessionId, isLoading, isRestoring, send } = useChat();
  const [input, setInput] = useState('');
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const hasUserMessages = messages.some(m => m.role === 'user');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  function handleSend() {
    if (!input.trim() || isLoading) return;
    send(input.trim());
    setInput('');
    inputRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white">
      
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 shadow-lg flex-shrink-0 z-10 relative">
        <div className="max-w-4xl mx-auto px-4 py-6 bg-slate-900/60 backdrop-blur rounded-2xl shadow-xl border border-slate-800">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <span className="text-white font-bold text-sm">KM</span>
            </div>
            <div>
              <h1 className="font-semibold text-slate-900 text-sm leading-tight">Kyron Medical</h1>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                <span className="text-xs text-slate-500">Aria · AI Assistant</span>
              </div>
            </div>
          </div>

          {/* ✅ SIMPLE WORKING BUTTONS */}
          <div className="flex items-center gap-2">

            {/* Admin Button */}
            <button
              onClick={() => window.location.href = 'http://localhost:5173/admin'}
              className="px-3 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-900"
            >
             <button
    onClick={() => {
      localStorage.removeItem('kyron_session_id'); // clear chat session
      window.location.reload(); // reload for new chat
    }}
    className="px-3 py-2 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-colors"
  >
    New Chat
  </button>

  <button
    onClick={() => window.location.href = 'http://localhost:5173/admin'}
    className="px-3 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900"
  ></button>
              Admin
            </button>

            {/* Call Button */}
            <button
              onClick={() => setShowVoiceModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700"
            >
              <Phone size={15} />
              <span className="hidden sm:inline">Call</span>
            </button>

          </div>
        </div>
      </header>

      {/* Chat */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {isRestoring ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Loader2 size={24} className="text-brand-600 animate-spin" />
              <p className="text-slate-500 text-sm">Restoring your conversation...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(message => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Quick Replies */}
      <div className="max-w-4xl w-full mx-auto">
        <QuickReplies
          onSelect={(msg) => send(msg)}
          visible={!hasUserMessages && !isRestoring}
        />
      </div>

      {/* Input */}
      <footer className="bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-end gap-3">
            
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={isLoading || isRestoring}
              className="flex-1 px-4 py-3 border border-slate-700 bg-slate-900 text-white placeholder:text-slate-400 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="w-12 h-12 bg-brand-600 text-white rounded-2xl flex items-center justify-center"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
            </button>
          </div>

          <div className="flex items-center justify-center gap-1 mt-2">
            <ShieldCheck size={12} className="text-slate-400" />
            <p className="text-xs text-slate-400">
              No medical advice · <a href="tel:911" className="underline">Call 911</a>
            </p>
          </div>
        </div>
      </footer>

      {/* Voice */}
      {showVoiceModal && (
        <VoiceCallModal
          sessionId={sessionId}
          onClose={() => setShowVoiceModal(false)}
        />
      )}

    </div>
  );
}