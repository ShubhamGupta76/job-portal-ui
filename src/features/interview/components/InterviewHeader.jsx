import React from 'react';
import { Clock, Radio, Wifi } from 'lucide-react';

const InterviewHeader = ({ session, timer, socketStatus, networkQuality }) => (
  <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/85 px-4 py-3 backdrop-blur-xl">
    <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">{session?.roundType || 'Interview'} Round</p>
        <h1 className="mt-1 text-xl font-black text-white">{session?.title || 'Live Interview'}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Pill icon={<Clock size={15} />} label={timer} />
        <Pill icon={<Radio size={15} />} label={socketStatus} />
        <Pill icon={<Wifi size={15} />} label={networkQuality} />
      </div>
    </div>
  </header>
);

const Pill = ({ icon, label }) => (
  <span className="flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 text-sm font-semibold text-slate-100">
    {icon}
    {label}
  </span>
);

export default InterviewHeader;
