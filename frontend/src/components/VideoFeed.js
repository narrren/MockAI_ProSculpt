import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import Webcam from 'react-webcam';

const VideoFeed = forwardRef(({ onAlerts, wsConnected }, ref) => {
  const webcamRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useImperativeHandle(ref, () => ({
    getScreenshot: () => webcamRef.current?.getScreenshot()
  }));

  useEffect(() => {
    if (!wsConnected) return;

    const interval = setInterval(() => {
      if (webcamRef.current && webcamRef.current.getScreenshot) {
        try {
          const imageSrc = webcamRef.current.getScreenshot();
          if (imageSrc) {
            // Image is already base64, send it via the WebSocket
            // This will be handled by the parent component
          }
        } catch (error) {
          console.error('Error capturing frame:', error);
        }
      }
    }, 500); // Check frame every 500ms

    return () => clearInterval(interval);
  }, [wsConnected]);

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'user'
  };

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: '20px' }}>
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
        style={{ width: '100%', borderRadius: '8px' }}
        onUserMedia={() => setIsStreaming(true)}
        onUserMediaError={(error) => {
          console.error('Webcam error:', error);
          setIsStreaming(false);
        }}
      />
      {!isStreaming && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '5px'
        }}>
          Waiting for camera...
        </div>
      )}
    </div>
  );
});

VideoFeed.displayName = 'VideoFeed';

export default VideoFeed;

