import React from 'react';
import { Camera, CameraOff, Expand, LogOut, Mic, MicOff, MonitorUp, PhoneOff } from 'lucide-react';

const InterviewControls = ({
  isMicMuted,
  isCameraOff,
  isScreenSharing,
  onToggleMic,
  onToggleCamera,
  onShareScreen,
  onLeave,
  onEnd,
  onFullscreen,
  canEnd,
}) => (
  <div className="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-[min(94vw,760px)] items-center justify-center gap-2 rounded-full border border-white/10 bg-slate-950/80 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
    <ControlButton active={!isMicMuted} danger={isMicMuted} onClick={onToggleMic} label={isMicMuted ? 'Unmute' : 'Mute'}>
      {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
    </ControlButton>
    <ControlButton active={!isCameraOff} danger={isCameraOff} onClick={onToggleCamera} label={isCameraOff ? 'Camera on' : 'Camera off'}>
      {isCameraOff ? <CameraOff size={20} /> : <Camera size={20} />}
    </ControlButton>
    <ControlButton active={isScreenSharing} onClick={onShareScreen} label="Share screen">
      <MonitorUp size={20} />
    </ControlButton>
    <ControlButton onClick={onFullscreen} label="Fullscreen">
      <Expand size={20} />
    </ControlButton>
    <ControlButton danger onClick={onLeave} label="Leave">
      <LogOut size={20} />
    </ControlButton>
    {canEnd && (
      <button
        type="button"
        onClick={onEnd}
        className="flex h-12 items-center gap-2 rounded-full bg-rose-500 px-5 text-sm font-bold text-white shadow-lg shadow-rose-950/40 transition hover:bg-rose-400"
      >
        <PhoneOff size={18} />
        End
      </button>
    )}
  </div>
);

const ControlButton = ({ children, label, active, danger, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    className={`flex h-12 w-12 items-center justify-center rounded-full border text-white transition hover:-translate-y-0.5 ${
      danger
        ? 'border-rose-300/30 bg-rose-500/90 hover:bg-rose-400'
        : active
          ? 'border-cyan-300/30 bg-cyan-400/20 text-cyan-100 hover:bg-cyan-400/30'
          : 'border-white/10 bg-white/10 hover:bg-white/20'
    }`}
  >
    {children}
  </button>
);

export default InterviewControls;
