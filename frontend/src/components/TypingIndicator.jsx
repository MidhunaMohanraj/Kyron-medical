import React from 'react';

export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 message-enter">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-brand-600 to-teal-500 flex items-center justify-center shadow-sm">
        <span className="text-white text-xs font-bold">A</span>
      </div>
      <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
        <div className="flex items-center gap-1 h-4">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    </div>
  );
}
