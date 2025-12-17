import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import Webcam from 'react-webcam';
import InterviewerAvatar from './InterviewerAvatar';
import './InterviewWorkspace.css';

function InterviewWorkspace({ 
  user, 
  sessionId, 
  currentQuestion,
  onSendMessage,
  messages,
  onRunCode,
  onSubmitCode,
  onEndInterview,
  webcamRef: parentWebcamRef,
  isInterviewerSpeaking,
  currentSpeechText,
  apiUrl = 'http://localhost:8000'
}) {
  // Use parent webcam ref if provided, otherwise create local one
  const localWebcamRef = useRef(null);
  const webcamRef = parentWebcamRef || localWebcamRef;
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [activeTab, setActiveTab] = useState('solution');
  const [consoleOutput, setConsoleOutput] = useState('Your code output will appear here...');
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(44 * 60 + 12); // 44:12 in seconds
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarReady, setAvatarReady] = useState(null);
  const chatEndRef = useRef(null);

  // Sample questions structure - will be replaced with real data
  const questions = [
    { id: 1, title: 'Introduction', status: 'completed' },
    { id: 2, title: 'Question 1', status: 'active' },
    { id: 3, title: 'Question 2', status: 'pending' }
  ];

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize code template based on question
  useEffect(() => {
    if (currentQuestion && currentQuestion.code_template) {
      setCode(currentQuestion.code_template);
    } else {
      // Default template
      setCode(`/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
   // Your code here
   
   
   
   
};`);
    }
  }, [currentQuestion]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    try {
      const result = await onRunCode(code, language);
      setConsoleOutput(result.output || result.error || 'Code executed successfully');
    } catch (error) {
      setConsoleOutput(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    setIsSubmitting(true);
    try {
      const result = await onSubmitCode(code, language, currentQuestion);
      setConsoleOutput(`Submission Result:\n${result.feedback || 'Code submitted successfully'}\n\nYou can view the analysis in the Analysis page.`);
    } catch (error) {
      setConsoleOutput(`Submission Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      onSendMessage(chatMessage);
      setChatMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getQuestionStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <span className="material-symbols-outlined status-icon completed">check_circle</span>;
      case 'active':
        return <span className="material-symbols-outlined status-icon active">radio_button_checked</span>;
      default:
        return <span className="material-symbols-outlined status-icon pending">radio_button_unchecked</span>;
    }
  };

  return (
    <div className="interview-workspace">
      {/* Left Sidebar (15%) */}
      <aside className="workspace-sidebar">
        <div className="sidebar-content">
          <div className="company-header">
            <div className="company-logo">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.8261 30.5736C16.7203 29.8826 20.2244 29.4783 24 29.4783C27.7756 29.4783 31.2797 29.8826 34.1739 30.5736C36.9144 31.2278 39.9967 32.7669 41.3563 33.8352L24.8486 7.36089C24.4571 6.73303 23.5429 6.73303 23.1514 7.36089L6.64374 33.8352C8.00331 32.7669 11.0856 31.2278 13.8261 30.5736Z" fill="#0df259"></path>
                <path clipRule="evenodd" d="M39.998 35.764C39.9944 35.7463 39.9875 35.7155 39.9748 35.6706C39.9436 35.5601 39.8949 35.4259 39.8346 35.2825C39.8168 35.2403 39.7989 35.1993 39.7813 35.1602C38.5103 34.2887 35.9788 33.0607 33.7095 32.5189C30.9875 31.8691 27.6413 31.4783 24 31.4783C20.3587 31.4783 17.0125 31.8691 14.2905 32.5189C12.0012 33.0654 9.44505 34.3104 8.18538 35.1832C8.17384 35.2075 8.16216 35.233 8.15052 35.2592C8.09919 35.3751 8.05721 35.4886 8.02977 35.589C8.00356 35.6848 8.00039 35.7333 8.00004 35.7388C8.00004 35.739 8 35.7393 8.00004 35.7388C8.00004 35.7641 8.0104 36.0767 8.68485 36.6314C9.34546 37.1746 10.4222 37.7531 11.9291 38.2772C14.9242 39.319 19.1919 40 24 40C28.8081 40 33.0758 39.319 36.0709 38.2772C37.5778 37.7531 38.6545 37.1746 39.3151 36.6314C39.9006 36.1499 39.9857 35.8511 39.998 35.764ZM4.95178 32.7688L21.4543 6.30267C22.6288 4.4191 25.3712 4.41909 26.5457 6.30267L43.0534 32.777C43.0709 32.8052 43.0878 32.8338 43.104 32.8629L41.3563 33.8352C43.104 32.8629 43.1038 32.8626 43.104 32.8629L43.1051 32.865L43.1065 32.8675L43.1101 32.8739L43.1199 32.8918C43.1276 32.906 43.1377 32.9246 43.1497 32.9473C43.1738 32.9925 43.2062 33.0545 43.244 33.1299C43.319 33.2792 43.4196 33.489 43.5217 33.7317C43.6901 34.1321 44 34.9311 44 35.7391C44 37.4427 43.003 38.7775 41.8558 39.7209C40.6947 40.6757 39.1354 41.4464 37.385 42.0552C33.8654 43.2794 29.133 44 24 44C18.867 44 14.1346 43.2794 10.615 42.0552C8.86463 41.4464 7.30529 40.6757 6.14419 39.7209C4.99695 38.7775 3.99999 37.4427 3.99999 35.7391C3.99999 34.8725 4.29264 34.0922 4.49321 33.6393C4.60375 33.3898 4.71348 33.1804 4.79687 33.0311C4.83898 32.9556 4.87547 32.8935 4.9035 32.8471C4.91754 32.8238 4.92954 32.8043 4.93916 32.7889L4.94662 32.777L4.95178 32.7688ZM35.9868 29.004L24 9.77997L12.0131 29.004C12.4661 28.8609 12.9179 28.7342 13.3617 28.6282C16.4281 27.8961 20.0901 27.4783 24 27.4783C27.9099 27.4783 31.5719 27.8961 34.6383 28.6282C35.082 28.7342 35.5339 28.8609 35.9868 29.004Z" fill="#0df259" fillRule="evenodd"></path>
              </svg>
            </div>
            <div className="company-info">
              <h1 className="company-name">Aptiva</h1>
              <p className="company-tagline">Insight That Elevates</p>
              <p className="interview-type">Technical Interview</p>
            </div>
          </div>

          <nav className="question-navigation">
            {questions.map((q, index) => (
              <div
                key={q.id}
                className={`question-item ${q.status}`}
                onClick={() => setCurrentQuestionIndex(index)}
              >
                {getQuestionStatusIcon(q.status)}
                <p className="question-title">{q.title}</p>
              </div>
            ))}
          </nav>
        </div>

        <button className="end-interview-btn" onClick={onEndInterview}>
          <span className="truncate">End Interview</span>
        </button>
      </aside>

      {/* Center Panel (55%) */}
      <main className="workspace-main">
        {/* Header */}
        <div className="main-header">
          <div className="question-info">
            <h2 className="question-title-main">
              {currentQuestion?.title || 'Question 1: Two Sum'}
            </h2>
            <p className="question-description">
              {currentQuestion?.description || 'Given an array of integers, return indices of the two numbers such that they add up to a specific target.'}
            </p>
          </div>
          <div className="timer-display">
            <span className="material-symbols-outlined">timer</span>
            <p>Time Remaining: {formatTime(timeRemaining)}</p>
          </div>
        </div>

        {/* Code Editor */}
        <div className="code-editor-area">
          <div className="editor-tabs">
            <button
              className={`editor-tab ${activeTab === 'solution' ? 'active' : ''}`}
              onClick={() => setActiveTab('solution')}
            >
              solution.js
            </button>
            <button
              className={`editor-tab ${activeTab === 'tests' ? 'active' : ''}`}
              onClick={() => setActiveTab('tests')}
            >
              tests.js
            </button>
          </div>

          <div className="editor-container">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="editor-actions">
            <button 
              className="action-btn run-btn" 
              onClick={handleRunCode}
              disabled={isRunning}
            >
              <span className="material-symbols-outlined">play_arrow</span>
              <span>{isRunning ? 'Running...' : 'Run Code'}</span>
            </button>
            <button 
              className="action-btn submit-btn" 
              onClick={handleSubmitCode}
              disabled={isSubmitting}
            >
              <span className="material-symbols-outlined">check</span>
              <span>{isSubmitting ? 'Submitting...' : 'Submit Solution'}</span>
            </button>
          </div>
        </div>

        {/* Console */}
        <div className="console-panel">
          <details open={consoleOpen} onToggle={(e) => setConsoleOpen(e.target.open)}>
            <summary className="console-header">
              <p>Console</p>
              <span className="material-symbols-outlined expand-icon">expand_less</span>
            </summary>
            <pre className="console-output">{consoleOutput}</pre>
          </details>
        </div>
      </main>

      {/* Right Panel (30%) */}
      <aside className="workspace-right-panel">
        <div className="right-panel-content">
          {/* Video Feeds */}
          <div className="video-container">
            <div className="interviewer-video">
              <InterviewerAvatar
                isSpeaking={isInterviewerSpeaking}
                currentSpeech={currentSpeechText}
                apiUrl={apiUrl}
                onAvatarReady={setAvatarReady}
              />
              {isInterviewerSpeaking && avatarReady !== false && (
                <div className="speaking-indicator">
                  <span className="material-symbols-outlined">mic</span>
                  <span>Speaking...</span>
                </div>
              )}
            </div>
            
            {/* Proctoring Info Overlay */}
            <div className="proctoring-overlay">
              <div className="user-webcam">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    width: 1280,
                    height: 720,
                    facingMode: "user"
                  }}
                  className="webcam-feed"
                />
              </div>
              <div className="proctoring-status">
                <div className="status-item">
                  <span className="material-symbols-outlined status-icon-secure">verified_user</span>
                  <p className="status-text">Proctoring Secure</p>
                </div>
                <p className="integrity-score">Integrity Score: 98%</p>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="chat-container">
            <div className="chat-messages">
              {messages && messages.length > 0 ? (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`chat-message ${msg.sender === 'user' ? 'user-message' : 'ai-message'}`}
                  >
                    {msg.sender !== 'user' && (
                      <div className="message-avatar ai-avatar">
                        <span className="material-symbols-outlined">psychology</span>
                      </div>
                    )}
                    <div className="message-bubble">
                      <p>{msg.text}</p>
                    </div>
                    {msg.sender === 'user' && (
                      <div className="message-avatar user-avatar"></div>
                    )}
                  </div>
                ))
              ) : (
                <div className="chat-message ai-message">
                  <div className="message-avatar ai-avatar">
                    <span className="material-symbols-outlined">psychology</span>
                  </div>
                  <div className="message-bubble">
                    <p>Hello! I'm your AI interviewer. Let's start with the first question. Please explain your approach before you begin coding.</p>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="chat-input-container">
              <input
                type="text"
                className="chat-input"
                placeholder="Type your message or use the mic..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button className="chat-btn mic-btn">
                <span className="material-symbols-outlined">mic</span>
              </button>
              <button className="chat-btn send-btn" onClick={handleSendMessage}>
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default InterviewWorkspace;

