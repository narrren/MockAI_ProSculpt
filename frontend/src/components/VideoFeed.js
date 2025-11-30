import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import Webcam from 'react-webcam';
import './VideoFeed.css';

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
    <div className="video-feed">
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
        className="video-feed__video"
        onUserMedia={() => setIsStreaming(true)}
        onUserMediaError={(error) => {
          console.error('Webcam error:', error);
          setIsStreaming(false);
        }}
      />
      <div className="video-feed__overlay">
        {!isStreaming && (
          <div className="video-feed__status video-feed__status--inactive">
            Waiting for camera...
          </div>
        )}
        {isStreaming && (
          <div className="video-feed__status video-feed__status--active">
            Camera Active
          </div>
        )}
      </div>
    </div>
  );
});

VideoFeed.displayName = 'VideoFeed';

export default VideoFeed;

