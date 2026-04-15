import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Proctoring = React.forwardRef(({ sessionToken, onEvent }, ref) => {
  const videoRef = React.useRef(null);
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [microphoneAllowed, setMicrophoneAllowed] = useState(false);
  const [tabSwitched, setTabSwitched] = useState(false);

  React.useImperativeHandle(ref, () => ({
    startProctoring: startProctoring
  }));

  const startProctoring = async () => {
    try {
      // Request camera and microphone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraAllowed(true);
      setMicrophoneAllowed(true);

      // Monitor for suspicious activities
      monitorTabSwitch();
      monitorWindowBlur();
      monitorCopyPaste();
      monitorNetworkChange();
    } catch (error) {
      console.error('Proctoring setup failed:', error);
      onEvent('CAMERA_DETECTED_MISSING', 80, { error: error.message });
    }
  };

  const monitorTabSwitch = () => {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        setTabSwitched(true);
        onEvent('TAB_SWITCH', 90, { timestamp: new Date().toISOString() });
      } else {
        setTabSwitched(false);
      }
    });
  };

  const monitorWindowBlur = () => {
    window.addEventListener('blur', () => {
      onEvent('WINDOW_BLUR', 60, { timestamp: new Date().toISOString() });
    });
  };

  const monitorCopyPaste = () => {
    document.addEventListener('copy', (e) => {
      e.preventDefault();
      onEvent('COPY_PASTE_DETECTED', 80, { action: 'copy' });
    });

    document.addEventListener('paste', (e) => {
      e.preventDefault();
      onEvent('COPY_PASTE_DETECTED', 80, { action: 'paste' });
    });
  };

  const monitorNetworkChange = () => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', () => {
        if (navigator.onLine === false) {
          onEvent('NETWORK_CHANGE', 70, { offline: true });
        }
      });
    }
  };

  return (
    <div className="hidden">
      <video ref={videoRef} autoPlay muted />
    </div>
  );
});

Proctoring.displayName = 'Proctoring';

export default Proctoring;
