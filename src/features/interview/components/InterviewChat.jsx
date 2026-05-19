import React, { useState } from 'react';
import { Send } from 'lucide-react';

const InterviewChat = ({ messages, onSend }) => {
  const [draft, setDraft] = useState('');

  const submit = (event) => {
    event.preventDefault();
    if (!draft.trim()) return;
    onSend(draft.trim());
    setDraft('');
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-lg border border-white/10 bg-white/[0.06]">
      <div className="border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-bold text-white">Interview Chat</h2>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && <p className="text-sm text-slate-400">No messages yet.</p>}
        {messages.map((message, index) => (
          <div key={`${message.senderId}-${message.createdAt || index}`} className="rounded-lg bg-slate-950/70 p-3">
            <p className="text-xs font-semibold text-cyan-200">{message.senderName || `User ${message.senderId}`}</p>
            <p className="mt-1 text-sm leading-6 text-slate-100">{message.content || message.payload?.content}</p>
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="flex gap-2 border-t border-white/10 p-3">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Send a message..."
          className="min-w-0 flex-1 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
        />
        <button type="submit" className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-400 text-slate-950 hover:bg-cyan-300">
          <Send size={18} />
        </button>
      </form>
    </section>
  );
};

export default InterviewChat;
