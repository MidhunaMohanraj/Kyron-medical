import React from 'react';
import { Calendar, RefreshCw, MapPin, Clock } from 'lucide-react';

const QUICK_REPLIES = [
  { icon: Calendar, label: 'Schedule Appointment', message: 'I need to schedule an appointment' },
  { icon: RefreshCw, label: 'Prescription Refill', message: 'I need a prescription refill' },
  { icon: MapPin, label: 'Office Location', message: 'What is your office address?' },
  { icon: Clock, label: 'Office Hours', message: 'What are your office hours?' },
];

export default function QuickReplies({ onSelect, visible }) {
  if (!visible) return null;
  return (
    <div className="px-4 pb-3 flex flex-wrap gap-2">
      {QUICK_REPLIES.map(({ icon: Icon, label, message }) => (
        <button
          key={label}
          onClick={() => onSelect(message)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs text-slate-600 font-medium hover:border-brand-500 hover:text-brand-600 hover:bg-brand-50 transition-all shadow-sm"
        >
          <Icon size={12} />
          {label}
        </button>
      ))}
    </div>
  );
}
