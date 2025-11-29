import React, { useState, useEffect } from 'react';
import { t } from '../i18n/languages';

const InterviewerAvatar = ({ isSpeaking, interviewerName = null, currentSpeech = null }) => {
  const displayName = interviewerName || t('app.interviewer');
  const [animationFrame, setAnimationFrame] = useState(0);

  useEffect(() => {
    if (isSpeaking) {
      const interval = setInterval(() => {
        setAnimationFrame(prev => (prev + 1) % 4);
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isSpeaking]);

  // Generate a professional avatar using CSS and emoji/icon
  const avatarStyle = {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '8px',
    position: 'relative',
    overflow: 'hidden',
    minHeight: '200px'
  };

  const avatarIconStyle = {
    fontSize: '80px',
    transition: 'transform 0.2s ease',
    transform: isSpeaking ? `scale(${1 + Math.sin(animationFrame) * 0.1})` : 'scale(1)',
    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
  };

  const nameStyle = {
    marginTop: '15px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'white',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
  };

  const statusStyle = {
    marginTop: '5px',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.8)',
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  };

  return (
    <div style={avatarStyle}>
      <div style={avatarIconStyle}>
        👨‍💼
      </div>
      <div style={nameStyle}>{displayName}</div>
      <div style={statusStyle}>
        {isSpeaking ? (
          <>
            <span style={{ 
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#4ade80',
              animation: 'pulse 1.5s infinite'
            }}></span>
            {t('app.speaking')}
          </>
        ) : (
          <>
            <span style={{ 
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#94a3b8'
            }}></span>
            {t('app.listening')}
          </>
        )}
      </div>
      {isSpeaking && currentSpeech && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '10px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          textAlign: 'center',
          maxHeight: '80px',
          overflowY: 'auto',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#4ade80' }}>
            🎤 Speaking:
          </div>
          <div style={{ lineHeight: '1.5' }}>
            {currentSpeech}
          </div>
        </div>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default InterviewerAvatar;

