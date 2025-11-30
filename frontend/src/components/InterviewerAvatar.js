import React, { useState, useEffect } from 'react';
import { t } from '../i18n/languages';
import './InterviewerAvatar.css';

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
    <div className={`avatar ${isSpeaking ? 'avatar--speaking' : ''}`}>
      <div className="avatar__container">
        <div className="avatar__icon">👨‍💼</div>
        <h3 className="avatar__name">{displayName}</h3>
        <div className="avatar__status">
          <span className="avatar__status-dot"></span>
          {isSpeaking ? t('app.speaking') : t('app.listening')}
        </div>
      </div>
      {isSpeaking && currentSpeech && (
        <div className="avatar__subtitle">
          {currentSpeech}
        </div>
      )}
    </div>
  );
};

export default InterviewerAvatar;

