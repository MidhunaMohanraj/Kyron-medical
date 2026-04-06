import React from 'react';
import { AlertCircle } from 'lucide-react';

function formatContent(content) {
  // Convert newlines to <br>, bold **text**, and numbered lists
  return content
    .split('\n')
    .map((line, i) => {
      // Bold
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Numbered list item
      if (/^\d+\./.test(line.trim())) {
        return `<div class="ml-2 my-0.5">${line}</div>`;
      }
      return line;
    })
    .join('<br/>');
}

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const isError = message.isError;

  if (isUser) {
    return (
      <div className="flex justify-end message-enter">
        <div className="max-w-[75%] lg:max-w-[65%]">
          <div className="bg-brand-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed shadow-sm">
            {message.content}
          </div>
          <div className="text-xs text-slate-400 mt-1 text-right pr-1">
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 message-enter">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-brand-600 to-teal-500 flex items-center justify-center shadow-sm">
        <span className="text-white text-xs font-bold">A</span>
      </div>

      <div className="max-w-[75%] lg:max-w-[65%]">
        <div className={`px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed shadow-sm ${
          isError
            ? 'bg-red-50 border border-red-200 text-red-800'
            : 'bg-white border border-slate-100 text-slate-800'
        }`}>
          {isError && (
            <div className="flex items-center gap-1.5 mb-1.5 text-red-600">
              <AlertCircle size={14} />
              <span className="text-xs font-medium">Error</span>
            </div>
          )}
          <div
            dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
            className="[&_strong]:font-semibold [&_strong]:text-slate-900"
          />
        </div>
        <div className="text-xs text-slate-400 mt-1 pl-1">
          Aria · {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}

function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
