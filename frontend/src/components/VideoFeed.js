import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import Webcam from 'react-webcam';
import './VideoFeed.css';

const VideoFeed = forwardRef(({ onAlerts, wsConnected }, ref) => {
  const webcamRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const retryTimeoutRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getScreenshot: () => {
      if (!webcamRef.current || !isStreaming) {
        return null;
      }
      try {
        return webcamRef.current.getScreenshot();
      } catch (error) {
        console.warn('Failed to capture screenshot:', error);
        return null;
      }
    }
  }));

  useEffect(() => {
    if (!wsConnected) return;

    const interval = setInterval(() => {
      if (webcamRef.current && webcamRef.current.getScreenshot && isStreaming) {
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
  }, [wsConnected, isStreaming]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'user'
  };

  const handleUserMedia = () => {
    console.log('Webcam stream started successfully');
    setIsStreaming(true);
    setCameraError(null);
  };

  const handleUserMediaError = (error) => {
    console.error('Webcam error:', error);
    setIsStreaming(false);
    
    // Provide user-friendly error messages
    let errorMessage = 'Camera access failed';
    if (error.name === 'NotReadableError') {
      errorMessage = 'Camera is in use by another application. Please close other apps using the camera.';
    } else if (error.name === 'NotAllowedError') {
      errorMessage = 'Camera permission denied. Please allow camera access in browser settings.';
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'No camera found. Please connect a camera and refresh.';
    } else if (error.name === 'OverconstrainedError') {
      errorMessage = 'Camera does not support requested settings.';
    }
    
    setCameraError(errorMessage);
    
    // Retry after 5 seconds for NotReadableError (camera might become available)
    if (error.name === 'NotReadableError') {
      console.log('Will retry camera access in 5 seconds...');
      retryTimeoutRef.current = setTimeout(() => {
        console.log('Retrying camera access...');
        setCameraError(null);
        // Force re-render by updating key
        setIsStreaming(false);
      }, 5000);
    }
  };

  return (
    <div className="video-feed">
      {!cameraError ? (
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="video-feed__video"
          onUserMedia={handleUserMedia}
          onUserMediaError={handleUserMediaError}
        />
      ) : (
        <div className="video-feed__error">
          <div className="video-feed__error-icon">📷</div>
          <div className="video-feed__error-message">{cameraError}</div>
          <button 
            className="video-feed__retry-btn"
            onClick={() => {
              setCameraError(null);
              setIsStreaming(false);
            }}
          >
            Retry
          </button>
        </div>
      )}
      <div className="video-feed__overlay">
        {!isStreaming && !cameraError && (
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

