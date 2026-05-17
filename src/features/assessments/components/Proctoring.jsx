import React, { useEffect, useImperativeHandle, useRef } from 'react';

const Proctoring = React.forwardRef(({ enabled = false, onEvent }, ref) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useImperativeHandle(ref, () => ({
    startProctoring,
  }));

  useEffect(() => {
    if (!enabled) return undefined;

    const handleVisibility = () => {
      if (document.hidden) {
        onEvent?.('TAB_SWITCH', 90, { hidden: true });
      }
    };
    const handleBlur = () => onEvent?.('WINDOW_BLUR', 70, {});
    const handleFullscreen = () => {
      if (!document.fullscreenElement) {
        onEvent?.('FULLSCREEN_EXIT', 90, {});
      }
    };
    const blockClipboard = (event) => {
      event.preventDefault();
      onEvent?.('COPY_PASTE_DETECTED', 85, { action: event.type });
    };
    const blockContext = (event) => {
      event.preventDefault();
      onEvent?.('RIGHT_CLICK', 55, {});
    };
    const blockSelection = (event) => {
      if (event.target?.closest?.('.monaco-editor')) return;
      event.preventDefault();
    };
    const blockKeys = (event) => {
      const key = event.key?.toLowerCase();
      const blockedCombo = (event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x', 'u', 's', 'p'].includes(key);
      const devToolsCombo = event.key === 'F12' || (event.ctrlKey && event.shiftKey && ['i', 'j', 'c'].includes(key));
      if (blockedCombo || devToolsCombo) {
        event.preventDefault();
        onEvent?.(devToolsCombo ? 'DEVTOOLS_ATTEMPT' : 'COPY_PASTE_DETECTED', devToolsCombo ? 95 : 85, {
          key: event.key,
          ctrl: event.ctrlKey,
          shift: event.shiftKey,
          meta: event.metaKey,
        });
      }
    };
    const beforeUnload = () => onEvent?.('WINDOW_BLUR', 75, { closing: true });

    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('fullscreenchange', handleFullscreen);
    document.addEventListener('copy', blockClipboard);
    document.addEventListener('cut', blockClipboard);
    document.addEventListener('paste', blockClipboard);
    document.addEventListener('contextmenu', blockContext);
    document.addEventListener('selectstart', blockSelection);
    document.addEventListener('keydown', blockKeys);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', beforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('fullscreenchange', handleFullscreen);
      document.removeEventListener('copy', blockClipboard);
      document.removeEventListener('cut', blockClipboard);
      document.removeEventListener('paste', blockClipboard);
      document.removeEventListener('contextmenu', blockContext);
      document.removeEventListener('selectstart', blockSelection);
      document.removeEventListener('keydown', blockKeys);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', beforeUnload);
      streamRef.current?.getTracks?.().forEach((track) => track.stop());
    };
  }, [enabled, onEvent]);

  async function startProctoring() {
    if (streamRef.current) {
      return true;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      return true;
    } catch (error) {
      onEvent?.('CAMERA_DETECTED_MISSING', 80, { error: error.message });
      return false;
    }
  }

  useEffect(() => {
    if (!enabled) return undefined;

    let lastWidth = window.outerWidth - window.innerWidth;
    let lastHeight = window.outerHeight - window.innerHeight;
    const detector = window.setInterval(() => {
      const widthDelta = window.outerWidth - window.innerWidth;
      const heightDelta = window.outerHeight - window.innerHeight;
      if ((widthDelta > 160 && widthDelta !== lastWidth) || (heightDelta > 160 && heightDelta !== lastHeight)) {
        onEvent?.('DEVTOOLS_ATTEMPT', 95, { widthDelta, heightDelta });
      }
      lastWidth = widthDelta;
      lastHeight = heightDelta;
    }, 1500);
    return () => window.clearInterval(detector);
  }, [enabled, onEvent]);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 hidden rounded-lg border border-white/10 bg-slate-950/80 p-2 shadow-2xl lg:block">
      <video ref={videoRef} autoPlay muted playsInline className="h-24 w-32 rounded-md object-cover opacity-70" />
    </div>
  );
});

Proctoring.displayName = 'Proctoring';

export default Proctoring;
