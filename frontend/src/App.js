import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import VideoFeed from './components/VideoFeed';
import './components/FloatingVideo.css';
import ChatInterface from './components/ChatInterface';
import CodeEditor from './components/CodeEditor';
import InterviewerAvatar from './components/InterviewerAvatar';
import AlertFlash from './components/AlertFlash';
import LanguageSelector from './components/LanguageSelector';
import Captcha from './components/Captcha';
import SkillHeatmap from './components/SkillHeatmap';
import PersonalitySelector from './components/PersonalitySelector';
import CareerBlueprint from './components/CareerBlueprint';
import CodeRevision from './components/CodeRevision';
import ProctoringDashboard from './components/ProctoringDashboard';
import CommunicationMetrics from './components/CommunicationMetrics';
import InterviewRounds from './components/InterviewRounds';
import IntegrityScore from './components/IntegrityScore';
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
  const [theme, setTheme] = useState(() => {
    // Check localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  
  // Keep ref in sync with state
  useEffect(() => {
    alertsEnabledRef.current = alertsEnabled;
  }, [alertsEnabled]);

  // Theme management
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      body.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
      body.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState(false);
  const [currentSpeechText, setCurrentSpeechText] = useState('');
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [windowBlurCount, setWindowBlurCount] = useState(0);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [isVideoMinimized, setIsVideoMinimized] = useState(false);
  const [currentCodingQuestion, setCurrentCodingQuestion] = useState(null);
  const [suggestedLanguage, setSuggestedLanguage] = useState('python');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [selectedPersonality, setSelectedPersonality] = useState('professional');
  const [currentRound, setCurrentRound] = useState(1);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const wsRef = useRef(null);
  const webcamRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const lastFocusTimeRef = useRef(Date.now());
  const alertsEnabledRef = useRef(true);

  // Always require login - no auto-authentication
  // Removed localStorage check - users must login every time

  // Check backend health on mount and periodically
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await axios.get(`${API_URL}/health`, { timeout: 3000 });
        if (response.data.status === 'healthy') {
          setBackendStatus('connected');
        } else {
          setBackendStatus('error');
        }
      } catch (error) {
        console.warn('Backend health check failed:', error.message);
        setBackendStatus('disconnected');
      }
    };
    
    checkBackend();
    const interval = setInterval(checkBackend, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Start interview session when authenticated
  useEffect(() => {
    if (isAuthenticated && user && captchaVerified && !sessionId) {
      const startSession = async () => {
        try {
          const response = await axios.post(`${API_URL}/session/start`, {
            user_id: user.email || user.id || 'user',
            interview_mode: 'standard',
            personality: selectedPersonality
          });
          setSessionId(response.data.session_id);
          console.log('Interview session started:', response.data);
        } catch (error) {
          console.error('Error starting session:', error);
          // Session creation is optional, continue without it
        }
      };
      startSession();
    }
  }, [isAuthenticated, user, captchaVerified, sessionId, selectedPersonality, API_URL]);

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
              // Filter out duplicate alerts
              const uniqueAlerts = [...new Set(data.alerts)];
              
              // Update alerts array (deduplicate)
              setAlerts(prev => {
                const existing = new Set(prev);
                const newAlerts = uniqueAlerts.filter(alert => !existing.has(alert));
                return [...prev, ...newAlerts];
              });
              
              // Flash alerts on screen only if alerts are enabled
              if (alertsEnabledRef.current) {
                setFlashAlerts(prev => {
                  const existing = new Set(prev);
                  const newAlerts = uniqueAlerts.filter(alert => !existing.has(alert));
                  return [...prev, ...newAlerts];
                });
              }
            } else {
              // Don't clear all alerts, just don't add new ones
              // setAlerts([]);
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
    const startupTime = Date.now();
    const startupGracePeriod = 10000; // 10 seconds grace period
    let lastTabSwitchAlert = 0;
    let lastBlurAlert = 0;
    const alertCooldown = 10000; // 10 seconds between alerts

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
        const now = Date.now();
        // Don't alert during startup or if alerts disabled
        if (now - startupTime < startupGracePeriod || !alertsEnabledRef.current) {
          return;
        }
        
        // Cooldown check
        if (now - lastTabSwitchAlert < alertCooldown) {
          return;
        }
        
        setTabSwitchCount(prev => prev + 1);
        lastTabSwitchAlert = now;
        const alertMsg = 'ALERT: Tab switched or window hidden!';
        setAlerts(prev => [...prev, alertMsg]);
        
        // Only flash if alerts enabled
        if (alertsEnabledRef.current) {
          setFlashAlerts(prev => [...prev, alertMsg]);
        }
        
        // Report to backend
        axios.post(`${API_URL}/report_violation`, {
          type: 'tab_switch',
          details: alertMsg,
          timestamp: new Date().toISOString()
        }).catch(err => console.error('Failed to report violation:', err));
      }
    };

    const handleBlur = () => {
      const now = Date.now();
      // Don't alert during startup or if alerts disabled
      if (now - startupTime < startupGracePeriod || !alertsEnabledRef.current) {
        return;
      }
      
      setWindowBlurCount(prev => prev + 1);
      const timeSinceLastFocus = now - lastFocusTimeRef.current;
      
      // Only alert if blurred for more than 2 seconds (increased from 1)
      if (timeSinceLastFocus > 2000) {
        // Cooldown check
        if (now - lastBlurAlert < alertCooldown) {
          return;
        }
        
        lastBlurAlert = now;
        const alertMsg = 'ALERT: Window lost focus!';
        setAlerts(prev => [...prev, alertMsg]);
        
        // Only flash if alerts enabled
        if (alertsEnabledRef.current) {
          setFlashAlerts(prev => [...prev, alertMsg]);
        }
        
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
    // Reset CAPTCHA verification when new user logs in
    setCaptchaVerified(false);
  };

  const handleSignupSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    // Reset CAPTCHA verification when new user signs up
    setCaptchaVerified(false);
  };

  // Handle CAPTCHA verification
  const handleCaptchaVerify = (verified) => {
    if (verified) {
      setCaptchaVerified(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    setAuthView('login');
  };

  // Monitor chat for interviewer speaking and coding questions
  const handleInterviewerMessage = (message, isCodingQuestion = false, suggestedLang = 'python') => {
    setIsInterviewerSpeaking(true);
    if (isCodingQuestion) {
      setCurrentCodingQuestion(message);
      setSuggestedLanguage(suggestedLang);
    } else {
      // Clear coding question if it's not a coding question
      setCurrentCodingQuestion(null);
    }
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

  // Show CAPTCHA if authenticated but not verified
  if (isAuthenticated && !captchaVerified) {
    return <Captcha onVerify={handleCaptchaVerify} />;
  }

  return (
    <div className="app">
      {alertsEnabled && <AlertFlash alerts={flashAlerts} onDismiss={handleAlertDismiss} />}
      
      {/* Theme Toggle Button - Fixed Position */}
      <button 
        className="theme-toggle"
        onClick={toggleTheme}
        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        aria-label="Toggle theme"
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      {/* Top Header */}
      <div className="topbar">
        <div className="topbar__inner">
          <div className="logo">
            <div className="logo__mark"></div>
            <span>{t('app.title')}</span>
          </div>
          <div className="spacer"></div>
          <div className="status-indicators">
            <LanguageSelector onLanguageChange={(lang) => {
              // Language change handled by reload in LanguageSelector
            }} />
            {/* Alerts Toggle Switch */}
            <div className="alerts-toggle-container">
              <label className="alerts-toggle-label">
                <span>
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
                <button onClick={handleLogout} className="btn btn--ghost btn--sm">{t('app.logout')}</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="app-container">
        {/* LEFT PANEL: Interviewer Avatar, Candidate Video & Analytics */}
        <div className="left-panel">
          {/* Personality Selector */}
          {sessionId && (
            <PersonalitySelector
              apiUrl={API_URL}
              onPersonalityChange={setSelectedPersonality}
            />
          )}

          {/* Interview Rounds */}
          {sessionId && (
            <InterviewRounds
              apiUrl={API_URL}
              userId={user?.email || user?.id || 'user'}
              onRoundChange={setCurrentRound}
            />
          )}

          {/* Video section removed - now floating */}

          {/* Analytics Toggle */}
          <div className="analytics-toggle">
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              {showAnalytics ? '📊 Hide Analytics' : '📊 Show Analytics'}
            </button>
          </div>

          {/* Analytics Panel */}
          {showAnalytics && sessionId && (
            <div className="analytics-panel">
              <SkillHeatmap
                apiUrl={API_URL}
                userId={user?.email || user?.id || 'user'}
              />
              <IntegrityScore
                apiUrl={API_URL}
                userId={user?.email || user?.id || 'user'}
              />
              <ProctoringDashboard
                apiUrl={API_URL}
                userId={user?.email || user?.id || 'user'}
              />
              <CommunicationMetrics
                apiUrl={API_URL}
                userId={user?.email || user?.id || 'user'}
              />
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Code Editor or Career Blueprint */}
        {currentCodingQuestion ? (
          <div className="right-panel">
            <CodeEditor 
              apiUrl={API_URL} 
              onViolation={handleCodeViolation}
              question={currentCodingQuestion}
              suggestedLanguage={suggestedLanguage}
              onCodeChange={(code) => {
                // Store code for revision
                if (sessionId) {
                  // Code revision will be triggered manually
                }
              }}
            />
          </div>
        ) : (
          <div className="right-panel right-panel--empty">
            {sessionId ? (
              <div className="right-panel-content">
                <div className="empty-state">
                  <div className="empty-state__icon">💻</div>
                  <h3 className="empty-state__title">Code Editor</h3>
                  <p className="empty-state__text">
                    Code Editor will appear here when a coding question is asked
                  </p>
                  <p className="empty-state__subtext">
                    Start chatting with the interviewer to begin!
                  </p>
                </div>
                <CareerBlueprint
                  apiUrl={API_URL}
                  userId={user?.email || user?.id || 'user'}
                />
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state__icon">💻</div>
                <h3 className="empty-state__title">Code Editor</h3>
                <p className="empty-state__text">
                  Code Editor will appear here when a coding question is asked
                </p>
                <p className="empty-state__subtext">
                  Start chatting with the interviewer to begin!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Video Feed in Left Corner */}
      <div className={`floating-video ${isVideoMinimized ? 'floating-video--min' : ''}`}>
        <div className="floating-video__panel">
          <div className="floating-video__header">
            <div className="floating-video__title">📹 {t('app.candidateVideo', 'Your Video')}</div>
            <button
              onClick={() => setIsVideoMinimized(!isVideoMinimized)}
              className="floating-video__minimize"
              title={isVideoMinimized ? 'Maximize video' : 'Minimize video'}
            >
              {isVideoMinimized ? '⬆️' : '⬇️'}
            </button>
          </div>
          {!isVideoMinimized && (
            <div className="floating-video__content">
              <VideoFeed 
                onAlerts={setAlerts} 
                wsConnected={wsConnected}
                ref={webcamRef}
              />
            </div>
          )}
        </div>
      </div>

      {/* Floating Chatbox with Avatar in Right Corner */}
      <div className={`chat ${isChatMinimized ? 'chat--min' : ''}`}>
        <div className="chat__panel">
          <div className="chat__header">
            <div className="chat__title">💬 {t('chat.title')}</div>
            <button
              onClick={() => setIsChatMinimized(!isChatMinimized)}
              className="chat__minimize"
              title={isChatMinimized ? 'Maximize chat' : 'Minimize chat'}
            >
              {isChatMinimized ? '⬆️' : '⬇️'}
            </button>
          </div>
          {!isChatMinimized && (
            <>
              {/* Interviewer Avatar Above Chat */}
              <div className="chat__avatar-section">
                <InterviewerAvatar 
                  isSpeaking={isInterviewerSpeaking}
                  interviewerName="AI Interviewer"
                  currentSpeech={currentSpeechText}
                />
              </div>
              {/* Chat Interface Below Avatar */}
              <ChatInterface 
                apiUrl={API_URL} 
                onInterviewerMessage={handleInterviewerMessage}
                onSpeakingStateChange={handleSpeakingStateChange}
                onSpeechTextChange={setCurrentSpeechText}
                onCodingQuestion={(question, language) => {
                  setCurrentCodingQuestion(question);
                  setSuggestedLanguage(language);
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

