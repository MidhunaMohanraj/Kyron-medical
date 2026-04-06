import React, { useState } from 'react';
import { Phone, X, Loader2 } from 'lucide-react';
import { initiateVoiceCall } from '../utils/api';

export default function VoiceCallModal({ sessionId, onClose }) {
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('idle'); // idle | calling | success | error
  const [errorMsg, setErrorMsg] = useState('');

  async function handleCall() {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setErrorMsg('Please enter a valid 10-digit phone number.');
      return;
    }
    const formatted = cleaned.length === 10 ? `+1${cleaned}` : `+${cleaned}`;

    setStatus('calling');
    setErrorMsg('');

    try {
      await initiateVoiceCall(formatted, sessionId);
      setStatus('success');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to place call. Please try again.');
      setStatus('error');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-teal-500 p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Phone size={22} />
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          <h2 className="text-xl font-semibold">Switch to Voice Call</h2>
          <p className="text-white/80 text-sm mt-1">Aria will call you and continue your conversation</p>
        </div>

        {/* Body */}
        <div className="p-6">
          {status === 'success' ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Phone size={24} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-slate-900 text-lg">Calling you now!</h3>
              <p className="text-slate-500 text-sm mt-1">Answer your phone to continue with Aria. She'll remember everything from this conversation.</p>
              <button onClick={onClose} className="mt-5 w-full py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors">
                Got it
              </button>
            </div>
          ) : (
            <>
              <p className="text-slate-600 text-sm mb-4">
                Enter the phone number you'd like us to call. Aria will pick up right where you left off.
              </p>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCall()}
                placeholder="(555) 000-0000"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                disabled={status === 'calling'}
              />
              {errorMsg && (
                <p className="text-red-500 text-xs mt-2">{errorMsg}</p>
              )}
              <p className="text-xs text-slate-400 mt-2">Standard call rates may apply. Your conversation context will be shared with the voice assistant.</p>

              <div className="flex gap-3 mt-5">
                <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors text-sm">
                  Cancel
                </button>
                <button
                  onClick={handleCall}
                  disabled={status === 'calling'}
                  className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {status === 'calling' ? (
                    <><Loader2 size={16} className="animate-spin" /> Calling...</>
                  ) : (
                    <><Phone size={16} /> Call Me</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}