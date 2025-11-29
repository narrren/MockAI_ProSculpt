import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import VideoFeed from './components/VideoFeed';
import ChatInterface from './components/ChatInterface';
import CodeEditor from './components/CodeEditor';
import InterviewerAvatar from './components/InterviewerAvatar';
import AlertFlash from './components/AlertFlash';
import LanguageSelector from './components/LanguageSelector';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { t } from './i18n/languages';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('login'); // 'login' or 'signup'
  const [alerts, setAlerts] = useState([]);
  const [flashAlerts, setFlashAlerts] = useState([]);
  const [alertsEnabled, setAlertsEnabled] = useState(true); // Toggle for alerts
  const [wsConnected, setWsConnected] = useState(false);
  
  // Keep ref in sync with state
  useEffect(() => {
    alertsEnabledRef.current = alertsEnabled;
  }, [alertsEnabled]);
  const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState(false);
  const [currentSpeechText, setCurrentSpeechText] = useState('');
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [windowBlurCount, setWindowBlurCount] = useState(0);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const wsRef = useRef(null);
  const webcamRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const lastFocusTimeRef = useRef(Date.now());
  const alertsEnabledRef = useRef(true);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // WebSocket connection for video proctoring
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(`${WS_URL}/ws/video`);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket connected');
          setWsConnected(true);
          
          // Start sending frames
          frameIntervalRef.current = setInterval(() => {
            if (webcamRef.current && ws.readyState === WebSocket.OPEN) {
              try {
                const imageSrc = webcamRef.current.getScreenshot();
                if (imageSrc && imageSrc.length > 100) { // Ensure we have actual image data
                  ws.send(imageSrc);
                } else {
                  console.warn('Screenshot is empty or too small');
                }
              } catch (error) {
                console.error('Error capturing frame:', error);
              }
            }
          }, 500);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.alerts && data.alerts.length > 0) {
              setAlerts(data.alerts);
              // Flash alerts on screen only if alerts are enabled
              if (alertsEnabledRef.current) {
                setFlashAlerts(prev => [...prev, ...data.alerts]);
              }
            } else {
              setAlerts([]);
            }
          } catch (error) {
            // Handle ping/pong
            if (event.data === 'pong') {
              // Connection is alive
            }
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setWsConnected(false);
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setWsConnected(false);
          // Attempt to reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setWsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Tab switching and window focus detection
  useEffect(() => {
    let hidden = false;
    let visibilityChange = '';

    if (typeof document.hidden !== 'undefined') {
      hidden = 'hidden';
      visibilityChange = 'visibilitychange';
    } else if (typeof document.webkitHidden !== 'undefined') {
      hidden = 'webkitHidden';
      visibilityChange = 'webkitvisibilitychange';
    } else if (typeof document.mozHidden !== 'undefined') {
      hidden = 'mozHidden';
      visibilityChange = 'mozvisibilitychange';
    } else if (typeof document.msHidden !== 'undefined') {
      hidden = 'msHidden';
      visibilityChange = 'msvisibilitychange';
    }

    const handleVisibilityChange = () => {
      if (document[hidden]) {
        setTabSwitchCount(prev => prev + 1);
        const alertMsg = 'ALERT: Tab switched or window hidden!';
        setAlerts(prev => [...prev, alertMsg]);
        setFlashAlerts(prev => [...prev, alertMsg]);
        // Report to backend
        axios.post(`${API_URL}/report_violation`, {
          type: 'tab_switch',
          details: alertMsg,
          timestamp: new Date().toISOString()
        }).catch(err => console.error('Failed to report violation:', err));
      }
    };

    const handleBlur = () => {
      setWindowBlurCount(prev => prev + 1);
      const timeSinceLastFocus = Date.now() - lastFocusTimeRef.current;
      if (timeSinceLastFocus > 1000) { // Only alert if blurred for more than 1 second
        const alertMsg = 'ALERT: Window lost focus!';
        setAlerts(prev => [...prev, alertMsg]);
        setFlashAlerts(prev => [...prev, alertMsg]);
        // Report to backend
        axios.post(`${API_URL}/report_violation`, {
          type: 'window_blur',
          details: alertMsg,
          timestamp: new Date().toISOString()
        }).catch(err => console.error('Failed to report violation:', err));
      }
    };

    const handleFocus = () => {
      lastFocusTimeRef.current = Date.now();
    };

    if (visibilityChange) {
      document.addEventListener(visibilityChange, handleVisibilityChange);
    }
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      if (visibilityChange) {
        document.removeEventListener(visibilityChange, handleVisibilityChange);
      }
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Handle code editor violations
  const handleCodeViolation = (violation) => {
    const alertText = `ALERT: ${violation}`;
    setAlerts(prev => [...prev, alertText]);
    // Only flash alerts if alerts are enabled
    if (alertsEnabledRef.current) {
      setFlashAlerts(prev => [...prev, alertText]);
    }
  };

  // Handle alert dismissal
  const handleAlertDismiss = (alertId) => {
    // Alert is automatically removed from flashAlerts after timeout
  };

  // Handle authentication
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleSignupSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    setAuthView('login');
  };

  // Monitor chat for interviewer speaking
  const handleInterviewerMessage = (message) => {
    setIsInterviewerSpeaking(true);
  };

  // Handle speaking state changes from chat
  const handleSpeakingStateChange = (speaking) => {
    setIsInterviewerSpeaking(speaking);
  };

  // Show authentication if not logged in
  if (!isAuthenticated) {
    return (
      <>
        {authView === 'login' ? (
          <Login 
            onLoginSuccess={handleLoginSuccess}
            onSwitchToSignup={() => setAuthView('signup')}
          />
        ) : (
          <Signup 
            onSignupSuccess={handleSignupSuccess}
            onSwitchToLogin={() => setAuthView('login')}
          />
        )}
      </>
    );
  }

  return (
    <div className="App">
      {alertsEnabled && <AlertFlash alerts={flashAlerts} onDismiss={handleAlertDismiss} />}
      <div className="app-header">
        <h1>{t('app.title')}</h1>
        <div className="status-indicators">
          <LanguageSelector onLanguageChange={(lang) => {
            // Language change handled by reload in LanguageSelector
          }} />
          {/* Alerts Toggle Switch */}
          <div className="alerts-toggle-container">
            <label className="alerts-toggle-label">
              <span style={{ marginRight: '8px', fontSize: '14px' }}>
                {alertsEnabled ? '🔔' : '🔕'} {alertsEnabled ? 'Alerts ON' : 'Alerts OFF'}
              </span>
              <input
                type="checkbox"
                checked={alertsEnabled}
                onChange={(e) => setAlertsEnabled(e.target.checked)}
                className="alerts-toggle-switch"
              />
            </label>
          </div>
          <div className={`status-indicator ${wsConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            {wsConnected ? t('app.proctoringActive') : t('app.proctoringOffline')}
          </div>
          {user && (
            <div className="user-info">
              <span>{user.name || user.email}</span>
              <button onClick={handleLogout} className="logout-button">{t('app.logout')}</button>
            </div>
          )}
        </div>
      </div>

      <div className="app-container">
        {/* LEFT PANEL: Interviewer Avatar, Candidate Video & Chat */}
        <div className="left-panel">
          <div className="video-section">
            {/* Interviewer Avatar (Top) */}
            <div className="interviewer-container">
              <InterviewerAvatar 
                isSpeaking={isInterviewerSpeaking}
                interviewerName="AI Interviewer"
                currentSpeech={currentSpeechText}
              />
            </div>
            
            {/* Candidate Video Feed (Bottom) */}
            <div className="candidate-video-container">
              <div className="video-container">
                <VideoFeed 
                  onAlerts={setAlerts} 
                  wsConnected={wsConnected}
                  ref={webcamRef}
                />
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT PANEL: Code Editor */}
        <div className="right-panel">
          <CodeEditor 
            apiUrl={API_URL} 
            onViolation={handleCodeViolation}
          />
        </div>
      </div>

      {/* Floating Chatbox in Right Corner */}
      <div className={`floating-chatbox ${isChatMinimized ? 'minimized' : ''}`}>
        <div className="chatbox-header">
          <div className="chatbox-title">
            💬 {t('chat.title')}
          </div>
          <button
            onClick={() => setIsChatMinimized(!isChatMinimized)}
            className="chatbox-minimize-btn"
            title={isChatMinimized ? 'Maximize chat' : 'Minimize chat'}
          >
            {isChatMinimized ? '⬆️' : '⬇️'}
          </button>
        </div>
        {!isChatMinimized && (
          <div className="chatbox-content">
            <ChatInterface 
              apiUrl={API_URL} 
              onInterviewerMessage={handleInterviewerMessage}
              onSpeakingStateChange={handleSpeakingStateChange}
              onSpeechTextChange={setCurrentSpeechText}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

