import React from 'react';
import { MonitorUp, MoreVertical, UserRound, Wifi } from 'lucide-react';
import { participantName } from '../utils/interviewUtils';

const ParticipantSidebar = ({ participants, currentUserId, canManage, onRemove }) => (
  <section className="rounded-lg border border-white/10 bg-white/[0.06]">
    <div className="border-b border-white/10 px-4 py-3">
      <h2 className="text-sm font-bold text-white">Participants</h2>
    </div>
    <div className="space-y-2 p-3">
      {participants.map((participant) => (
        <div key={participant.userId} className="flex items-center gap-3 rounded-lg bg-slate-950/60 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-100">
            <UserRound size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {participantName(participant)}{participant.userId === currentUserId ? ' (You)' : ''}
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
              <span className={participant.status === 'ONLINE' ? 'text-emerald-300' : 'text-slate-500'}>{participant.status}</span>
              <Wifi size={12} />
              <span>{participant.networkQuality || 'unknown'}</span>
              {participant.screenSharing && <MonitorUp size={12} className="text-cyan-200" />}
            </div>
          </div>
          {canManage && participant.userId !== currentUserId && (
            <button
              type="button"
              onClick={() => onRemove(participant.userId)}
              className="rounded-full p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-200"
              title="Remove participant"
            >
              <MoreVertical size={16} />
            </button>
          )}
        </div>
      ))}
    </div>
  </section>
);

export default ParticipantSidebar;
