import React, { useEffect, useRef } from 'react';
import { MicOff, VideoOff } from 'lucide-react';

const VideoTile = ({ stream, name, muted = false, cameraOff = false, micMuted = false, isLocal = false }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="group relative min-h-[220px] overflow-hidden rounded-lg border border-white/10 bg-slate-950 shadow-2xl shadow-black/20">
      {stream && !cameraOff ? (
        <video ref={videoRef} autoPlay playsInline muted={muted} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full min-h-[220px] items-center justify-center bg-[radial-gradient(circle_at_top,#1d4ed8_0,#0f172a_45%,#020617_100%)]">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/10 text-3xl font-bold text-white">
            {(name || 'U').slice(0, 1).toUpperCase()}
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent p-4">
        <span className="rounded-full bg-black/40 px-3 py-1 text-sm font-semibold text-white backdrop-blur">
          {name}{isLocal ? ' (You)' : ''}
        </span>
        <div className="flex gap-2">
          {micMuted && <StatusPill icon={<MicOff size={14} />} />}
          {cameraOff && <StatusPill icon={<VideoOff size={14} />} />}
        </div>
      </div>
    </div>
  );
};

const StatusPill = ({ icon }) => (
  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/90 text-white">
    {icon}
  </span>
);

export default VideoTile;
