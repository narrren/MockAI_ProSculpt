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
import ResumeUpload from './components/ResumeUpload';
import Profile from './components/Profile';
import InterviewWorkspace from './components/InterviewWorkspace';
import Dashboard from './components/Dashboard';
import CodeAnalysis from './components/CodeAnalysis';
import AnalysisPage from './components/AnalysisPage';
import ModernHeader from './components/ModernHeader';
import BugDebuggingRound from './components/BugDebuggingRound';
import DatabaseOptimizationLab from './components/DatabaseOptimizationLab';
import LoginNew from './pages/LoginNew';
import SignupNew from './pages/SignupNew';
import speechService from './services/speechService';
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

  // Force dark mode only
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    root.setAttribute('data-theme', 'dark');
    body.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }, []);
  
  const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState(false);
  const [currentSpeechText, setCurrentSpeechText] = useState('');
  const [avatarReady, setAvatarReady] = useState(null); // null = checking, true = ready, false = failed
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [windowBlurCount, setWindowBlurCount] = useState(0);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [isVideoMinimized, setIsVideoMinimized] = useState(false);
  const [isInterviewerMuted, setIsInterviewerMuted] = useState(false);
  const [currentCodingQuestion, setCurrentCodingQuestion] = useState(null);
  const [suggestedLanguage, setSuggestedLanguage] = useState('python');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [selectedPersonality, setSelectedPersonality] = useState('professional');
  const [currentRound, setCurrentRound] = useState(1);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [hasResume, setHasResume] = useState(null); // null = checking, true/false = known
  const [showResumeUpload, setShowResumeUpload] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'interview', 'workspace', 'analysis'
  const [showCodeAnalysis, setShowCodeAnalysis] = useState(false);
  const [analysisCode, setAnalysisCode] = useState('');
  const [messages, setMessages] = useState([]);
  const [showBugDebugging, setShowBugDebugging] = useState(false);
  const [showDBLab, setShowDBLab] = useState(false);
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
        const response = await axios.get(`${API_URL}/health`, { 
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (response.data && response.data.status === 'healthy') {
          setBackendStatus('connected');
        } else {
          setBackendStatus('error');
        }
      } catch (error) {
        console.warn('Backend health check failed:', error.message);
        setBackendStatus('disconnected');
      }
    };
    
    // Check immediately and then periodically
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
                // Check if we have valid base64 image data (should start with "data:image/")
                if (imageSrc && imageSrc.startsWith('data:image/') && imageSrc.length > 1000) {
                  ws.send(imageSrc);
                } else if (imageSrc === null) {
                  // Camera not ready yet, silently skip
                } else {
                  // Only log warning occasionally to avoid spam
                  if (Math.random() < 0.05) { // Log ~5% of failures
                    console.warn('Screenshot not ready or invalid format');
                  }
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
  const handleLoginSuccess = async (userData) => {
    console.log('[App] handleLoginSuccess called with userData:', userData);
    console.log('[App] Token in userData:', userData.token ? userData.token.substring(0, 20) + '...' : 'MISSING');
    
    setUser(userData);
    setIsAuthenticated(true);
    
    // Save to localStorage for persistence
    localStorage.setItem('user', JSON.stringify(userData));
    
    // CRITICAL: Only store actual token, never fallback strings
    const token = userData.token || localStorage.getItem('auth_token');
    if (token && token !== 'authenticated' && token !== 'null' && token !== 'undefined' && token.length > 20) {
      localStorage.setItem('auth_token', token);
      console.log('[App] ✅ Valid token stored:', token.substring(0, 20) + '...');
    } else {
      console.error('[App] ❌ Invalid or missing token!', token);
      console.error('[App] userData:', userData);
      // Don't store invalid token - user needs to log in again
      localStorage.removeItem('auth_token');
    }
    // Reset CAPTCHA verification when new user logs in
    setCaptchaVerified(false);
    
    // Check if user has uploaded resume (skip for test accounts - they go directly to interview)
    if (userData.is_test) {
      setHasResume(null); // Don't check for test accounts - they can add resume later in profile
      setShowResumeUpload(false); // Never show upload page for test accounts
    } else {
      try {
        const token = userData.token || localStorage.getItem('auth_token');
        // Validate token - reject placeholder strings
        if (token && token !== 'authenticated' && token !== 'null' && token !== 'undefined') {
          const response = await axios.get(`${API_URL}/user/resume-status`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          const hasResumeStatus = response.data.has_resume || false;
          setHasResume(hasResumeStatus);
          setShowResumeUpload(!hasResumeStatus); // Show upload if no resume
        } else {
          setHasResume(false);
          setShowResumeUpload(true);
        }
      } catch (error) {
        console.error('Error checking resume status:', error);
        // Default to showing upload if check fails
        setHasResume(false);
        setShowResumeUpload(true);
      }
    }
  };

  const handleSignupSuccess = async (userData) => {
    console.log('[App] handleSignupSuccess called with userData:', userData);
    console.log('[App] Token in userData:', userData.token ? userData.token.substring(0, 20) + '...' : 'MISSING');
    
    setUser(userData);
    setIsAuthenticated(true);
    
    // Save to localStorage for persistence
    localStorage.setItem('user', JSON.stringify(userData));
    
    // CRITICAL: Only store actual token, never fallback strings
    const token = userData.token || localStorage.getItem('auth_token');
    if (token && token !== 'authenticated' && token !== 'null' && token !== 'undefined' && token.length > 20) {
      localStorage.setItem('auth_token', token);
      console.log('[App] ✅ Valid token stored:', token.substring(0, 20) + '...');
    } else {
      console.error('[App] ❌ Invalid or missing token!', token);
      console.error('[App] userData:', userData);
      // Don't store invalid token - user needs to sign up again
      localStorage.removeItem('auth_token');
    }
    // Reset CAPTCHA verification when new user signs up
    setCaptchaVerified(false);
    
    // Check if user already has resume (might have registered before)
    if (userData.is_test) {
      setHasResume(null); // Don't check for test accounts
      setShowResumeUpload(false); // Never show upload page for test accounts
    } else {
      // Check resume status from userData or make API call
      const hasResumeStatus = userData.has_resume || false;
      if (!hasResumeStatus) {
        // Double-check with API using authentication token
        try {
          const token = localStorage.getItem('auth_token');
          // Validate token - reject placeholder strings
          if (token && token !== 'authenticated' && token !== 'null' && token !== 'undefined') {
            const response = await axios.get(`${API_URL}/user/resume-status`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            const apiHasResume = response.data.has_resume || false;
            setHasResume(apiHasResume);
            setShowResumeUpload(!apiHasResume);
          } else {
            setHasResume(false);
            setShowResumeUpload(true);
          }
        } catch (error) {
          console.error('Error checking resume status:', error);
          setHasResume(false);
          setShowResumeUpload(true);
        }
      } else {
        setHasResume(true);
        setShowResumeUpload(false);
      }
    }
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

  // Handlers for new workspace
  const handleSendMessage = async (message) => {
    // Add user message to chat
    setMessages(prev => [...prev, { sender: 'user', text: message }]);
    
    try {
      const response = await axios.post(`${API_URL}/chat`, { message });
      const aiMessage = response.data.reply;
      
      // Add AI message to chat
      setMessages(prev => [...prev, { sender: 'ai', text: aiMessage }]);
      
      // Handle coding question detection
      if (response.data.is_coding_question) {
        setCurrentCodingQuestion(aiMessage);
        setSuggestedLanguage(response.data.suggested_language || 'javascript');
      }
      
      // Speak the AI response
      if (!isInterviewerMuted) {
        speechService.speak(aiMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, I encountered an error. Please try again.' }]);
    }
  };

  const handleRunCode = async (code, language) => {
    try {
      const response = await axios.post(`${API_URL}/run_code`, { code, language });
      return { output: response.data.output, error: response.data.error };
    } catch (error) {
      console.error('Error running code:', error);
      return { error: error.message };
    }
  };

  const handleSubmitCode = async (code, language, question) => {
    const questionText = question || currentCodingQuestion || 'Two Sum problem';
    try {
      const response = await axios.post(`${API_URL}/evaluate_code`, {
        code,
        language,
        question: questionText
      });
      
      // Store submitted code for analysis page
      localStorage.setItem('lastCodeSubmission', JSON.stringify({
        code: code,
        language: language,
        question: questionText,
        timestamp: Date.now()
      }));
      
      return {
        feedback: response.data.feedback,
        score: response.data.score,
        is_correct: response.data.is_correct
      };
    } catch (error) {
      console.error('Error submitting code:', error);
      return { feedback: error.message };
    }
  };

  const handleEndInterview = () => {
    if (window.confirm('Are you sure you want to end the interview?')) {
      handleLogout();
    }
  };

  const handleNavigate = (view) => {
    setCurrentView(view);
  };

  const handleStartInterview = () => {
    setCurrentView('interview');
  };

  const handleShowCodeAnalysis = (code) => {
    setAnalysisCode(code);
    setShowCodeAnalysis(true);
  };

  // Show authentication if not logged in
  if (!isAuthenticated) {
    return (
      <>
        {authView === 'login' ? (
          <LoginNew 
            onLoginSuccess={handleLoginSuccess}
            onSwitchToSignup={() => setAuthView('signup')}
          />
        ) : (
          <SignupNew 
            onSignupSuccess={handleSignupSuccess}
            onSwitchToLogin={() => setAuthView('login')}
          />
        )}
      </>
    );
  }

  // Show CAPTCHA if authenticated but not verified - Auto-verify for new design
  if (isAuthenticated && !captchaVerified) {
    // Auto-verify immediately
    setTimeout(() => setCaptchaVerified(true), 0);
  }

  // Show resume upload when button is clicked
  if (isAuthenticated && showResumeUpload) {
    return (
      <div className="app modern-app">
        <ModernHeader
          user={user}
          onUploadResume={() => setShowResumeUpload(true)}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          currentView={currentView}
          onShowProfile={() => setShowProfile(true)}
        />
        <ResumeUpload
          apiUrl={API_URL}
          userId={user?.email || user?.id || 'user'}
          onUploadSuccess={(data) => {
            try {
              console.log('[App] Resume upload success, data:', data);
              console.log('[App] Resume data received:', {
                skills: data.skills?.length || 0,
                experience: data.experience?.length || 0,
                education: data.education?.length || 0,
                hasSummary: !!data.summary,
                hasAnalysis: !!data.analysis
              });
              setHasResume(true);
              setShowResumeUpload(false);
              // Ensure we stay authenticated
              if (!isAuthenticated && user) {
                setIsAuthenticated(true);
              }
              // Force dashboard refresh by updating refreshTrigger
              // The Dashboard component will reload data when refreshTrigger changes
              if (currentView === 'dashboard') {
                // Trigger refresh by toggling hasResume (Dashboard watches this)
                // Add a delay to ensure database commit is complete
                setTimeout(() => {
                  console.log('[App] Triggering dashboard refresh...');
                  setHasResume(true); // This will trigger Dashboard refresh
                  // Also force a manual refresh by changing the refresh trigger
                  setCurrentView('dashboard'); // This will cause Dashboard to remount/reload
                }, 500);
              } else {
                // If not on dashboard, navigate to it
                setCurrentView('dashboard');
                setHasResume(true);
              }
            } catch (error) {
              console.error('Error in resume upload success handler:', error);
            }
          }}
          onCancel={() => {
            setShowResumeUpload(false);
          }}
        />
      </div>
    );
  }

  // Show Code Analysis overlay (highest priority)
  if (showCodeAnalysis) {
    return (
      <>
        <CodeAnalysis
          userCode={analysisCode}
          question={currentCodingQuestion}
          language={suggestedLanguage}
          apiUrl={API_URL}
          onClose={() => setShowCodeAnalysis(false)}
        />
      </>
    );
  }
  
  // Show Bug Debugging Round (high priority - before dashboard)
  if (showBugDebugging) {
    return (
      <div className="app">
        <BugDebuggingRound
          apiUrl={API_URL}
          sessionId={sessionId || `session_${Date.now()}`}
          onClose={() => setShowBugDebugging(false)}
        />
      </div>
    );
  }

  // Show Database Optimization Lab (high priority - before dashboard)
  if (showDBLab) {
    return (
      <div className="app">
        <DatabaseOptimizationLab
          apiUrl={API_URL}
          onClose={() => setShowDBLab(false)}
        />
      </div>
    );
  }
  
  // Dashboard View
  if (currentView === 'dashboard') {
    return (
      <div className="app modern-app">
        {alertsEnabled && <AlertFlash alerts={flashAlerts} onDismiss={handleAlertDismiss} />}
        
        <ModernHeader
          user={user}
          onUploadResume={() => setShowResumeUpload(true)}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          currentView={currentView}
        />
        
        <Dashboard
          user={user}
          apiUrl={API_URL}
          onStartInterview={handleStartInterview}
          onUploadResume={() => setShowResumeUpload(true)}
          refreshTrigger={hasResume}
          onOpenBugDebugging={() => setShowBugDebugging(true)}
          onOpenDBLab={() => setShowDBLab(true)}
        />
      </div>
    );
  }
  
  // Analysis View
  if (currentView === 'analysis') {
    return (
      <div className="app modern-app">
        {alertsEnabled && <AlertFlash alerts={flashAlerts} onDismiss={handleAlertDismiss} />}
        
        <ModernHeader
          user={user}
          onUploadResume={() => setShowResumeUpload(true)}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          currentView="analysis"
          onShowProfile={() => setShowProfile(true)}
        />
        
        <AnalysisPage
          user={user}
          apiUrl={API_URL}
          sessionId={sessionId}
        />
      </div>
    );
  }

  // Interview/Workspace View
  if (currentView === 'interview' || currentView === 'workspace') {
    return (
      <div className="app">
        {alertsEnabled && <AlertFlash alerts={flashAlerts} onDismiss={handleAlertDismiss} />}
        
        <ModernHeader
          user={user}
          onUploadResume={() => setShowResumeUpload(true)}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          currentView="interview"
          onShowProfile={() => setShowProfile(true)}
        />

        <InterviewWorkspace
          user={user}
          sessionId={sessionId}
          currentQuestion={currentCodingQuestion}
          onSendMessage={handleSendMessage}
          messages={messages}
          onRunCode={handleRunCode}
          onSubmitCode={handleSubmitCode}
          onEndInterview={() => setCurrentView('dashboard')}
          webcamRef={webcamRef}
          isInterviewerSpeaking={isInterviewerSpeaking}
          currentSpeechText={currentSpeechText}
          apiUrl={API_URL}
        />
      </div>
    );
  }

  // Show Profile
  if (showProfile) {
    return (
      <div className="app modern-app">
        {alertsEnabled && <AlertFlash alerts={flashAlerts} onDismiss={handleAlertDismiss} />}
        
        <ModernHeader
          user={user}
          onUploadResume={() => setShowResumeUpload(true)}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          currentView={currentView}
          onShowProfile={() => setShowProfile(true)}
        />
        
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Profile</h1>
            <button
              onClick={() => setShowProfile(false)}
              style={{
                padding: '0.5rem 1rem',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600
              }}
            >
              Close
            </button>
          </div>
          <Profile
            apiUrl={API_URL}
            userId={user?.email || user?.id || 'user'}
            onResumeChange={() => {
              if (user && !user.is_test) {
                const token = localStorage.getItem('auth_token');
                if (token) {
                  axios.get(`${API_URL}/user/resume-status`, {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                    },
                  })
                    .then(response => {
                      setHasResume(response.data.has_resume || false);
                    })
                    .catch(error => {
                      console.error('Error checking resume status:', error);
                    });
                }
              }
            }}
          />
        </div>
      </div>
    );
  }

  // Default to dashboard if nothing else matches
  return (
    <div className="app modern-app">
      {alertsEnabled && <AlertFlash alerts={flashAlerts} onDismiss={handleAlertDismiss} />}
      
      <ModernHeader
        user={user}
        onUploadResume={() => setShowResumeUpload(true)}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        currentView={currentView}
        onShowProfile={() => setShowProfile(true)}
      />
      
      <Dashboard
        user={user}
        apiUrl={API_URL}
        onStartInterview={handleStartInterview}
        onUploadResume={() => setShowResumeUpload(true)}
        refreshTrigger={hasResume}
        onOpenBugDebugging={() => setShowBugDebugging(true)}
        onOpenDBLab={() => setShowDBLab(true)}
      />
    </div>
  );
}

export default App;
