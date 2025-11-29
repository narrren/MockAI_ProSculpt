import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import speechService from '../services/speechService';
import { t } from '../i18n/languages';

const ChatInterface = ({ apiUrl, onInterviewerMessage, onSpeakingStateChange, onSpeechTextChange }) => {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: t('chat.welcome', 'Hello! Welcome to your technical interview. I\'m your AI interviewer. Are you ready to begin?')
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeechText, setCurrentSpeechText] = useState('');
  const messagesEndRef = useRef(null);

  // Function to speak a message
  const speakMessage = (text) => {
    if (!speechService.isSynthesisAvailable()) {
      console.warn('Text-to-speech not available');
      return;
    }

    // Set speech text for subtitles
    setCurrentSpeechText(text);
    if (onSpeechTextChange) {
      onSpeechTextChange(text);
    }

    setIsSpeaking(true);
    if (onSpeakingStateChange) {
      onSpeakingStateChange(true);
    }

    speechService.speak(
      text,
      () => {
        // onStart
        setIsSpeaking(true);
        setCurrentSpeechText(text);
        if (onSpeakingStateChange) {
          onSpeakingStateChange(true);
        }
        if (onSpeechTextChange) {
          onSpeechTextChange(text);
        }
      },
      () => {
        // onEnd
        setIsSpeaking(false);
        setCurrentSpeechText('');
        if (onSpeakingStateChange) {
          onSpeakingStateChange(false);
        }
        if (onSpeechTextChange) {
          onSpeechTextChange('');
        }
      },
      (error) => {
        // onError
        console.error('TTS Error:', error);
        setIsSpeaking(false);
        setCurrentSpeechText('');
        if (onSpeakingStateChange) {
          onSpeakingStateChange(false);
        }
        if (onSpeechTextChange) {
          onSpeechTextChange('');
        }
      }
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load voices when component mounts
  useEffect(() => {
    if (speechService.isSynthesisAvailable()) {
      // Chrome needs voices to be loaded
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
          setTimeout(loadVoices, 100);
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Trigger speaking animation and TTS for initial message
  useEffect(() => {
    // Wait a bit for voices to load, then speak initial message
    const timer = setTimeout(() => {
      if (messages.length > 0 && messages[0].sender === 'ai') {
        const initialMessage = messages[0].text;
        if (onInterviewerMessage) {
          onInterviewerMessage(initialMessage);
        }
        // Speak the initial message after a short delay
        setTimeout(() => {
          speakMessage(initialMessage);
        }, 500);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const newMsgs = [...messages, { sender: 'user', text: userMessage }];
    setMessages(newMsgs);
    setInput('');
    setIsLoading(true);

    try {
      const res = await axios.post(`${apiUrl}/chat`, { message: userMessage });
      const aiMessage = { sender: 'ai', text: res.data.reply };
      setMessages([...newMsgs, aiMessage]);
      if (onInterviewerMessage) {
        onInterviewerMessage(res.data.reply);
      }
      // Speak the AI response
      speakMessage(res.data.reply);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([
        ...newMsgs,
        {
          sender: 'ai',
          text: 'Sorry, I encountered an error. Please ensure the backend server is running and Ollama is active.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Start/Stop voice input
  const toggleVoiceInput = async () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
      return;
    }

    // Check if speech recognition is available
    if (!speechService.isRecognitionAvailable()) {
      // Provide more helpful error message
      const isSecure = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const browser = navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                     navigator.userAgent.includes('Edge') ? 'Edge' : 
                     navigator.userAgent.includes('Firefox') ? 'Firefox' : 'your browser';
      
      let errorMsg = 'Speech recognition is not available. ';
      
      if (!isSecure && window.location.protocol !== 'https:') {
        errorMsg += 'Speech recognition requires HTTPS or localhost. ';
      }
      
      if (!navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('Edge')) {
        errorMsg += 'Please use Chrome or Edge browser for speech recognition.';
      } else {
        errorMsg += 'Please check your browser settings and ensure microphone permissions are enabled.';
      }
      
      alert(errorMsg);
      console.error('Speech recognition check failed:', {
        isSecure,
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        userAgent: navigator.userAgent
      });
      return;
    }

    // Request microphone permission first - this MUST be done on user interaction
    try {
      console.log('Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone permission granted');
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error('Microphone permission error:', err);
      let errorMsg = 'Microphone permission denied. ';
      if (err.name === 'NotAllowedError') {
        errorMsg += 'Please allow microphone access in your browser settings and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMsg += 'No microphone found. Please connect a microphone and try again.';
      } else {
        errorMsg += `Error: ${err.message}`;
      }
      alert(errorMsg);
      return;
    }

    // Now start speech recognition
    console.log('Starting speech recognition...');
    
    // Small delay to ensure permission is fully granted
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const success = speechService.startListening(
      (transcript) => {
        // onResult
        console.log('Speech recognized callback received:', transcript);
        setIsListening(false);
        if (transcript && transcript.trim()) {
          setInput(transcript.trim());
          // Automatically send after speech recognition
          setTimeout(() => {
            sendMessage();
          }, 300);
        } else {
          // If no transcript, show message
          console.warn('Empty transcript received');
          setIsListening(false);
        }
      },
      (error) => {
        // onError
        console.error('Speech recognition error callback:', error);
        setIsListening(false);
        if (error === 'no-speech') {
          alert('No speech detected. Please try speaking again.');
        } else if (error === 'aborted') {
          // User stopped it, no need to alert
          console.log('Speech recognition aborted by user');
        } else if (error === 'network') {
          alert('Network error. Please check your connection and try again.');
        } else if (error === 'not-allowed') {
          alert('Microphone permission denied. Please allow microphone access and try again.');
        } else if (error === 'audio-capture') {
          alert('No microphone found. Please connect a microphone and try again.');
        } else {
          alert(`Speech recognition error: ${error}. Please try again.`);
        }
      }
    );
    
    if (success) {
      setIsListening(true);
      console.log('Speech recognition started successfully');
    } else {
      setIsListening(false);
      alert('Failed to start speech recognition. Please check microphone permissions and try again.');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      background: '#1e1e1e'
    }}>
      
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        background: '#1e1e1e',
        scrollbarWidth: 'thin',
        scrollbarColor: '#555 #1e1e1e'
      }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: '20px',
              alignItems: 'flex-start',
              gap: '10px'
            }}
          >
            {m.sender === 'ai' && (
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0
              }}>
                👨‍💼
              </div>
            )}
            <div style={{
              maxWidth: '70%',
              padding: '12px 16px',
              borderRadius: m.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: m.sender === 'user' 
                ? 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)' 
                : 'linear-gradient(135deg, #444 0%, #333 100%)',
              color: 'white',
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              lineHeight: '1.5'
            }}>
              {m.text}
            </div>
            {m.sender === 'user' && (
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0
              }}>
                👤
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            marginBottom: '15px'
          }}>
            <div style={{
              padding: '10px 15px',
              borderRadius: '10px',
              background: '#444',
              color: 'white'
            }}>
              {t('chat.thinking')}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{
        padding: '12px',
        background: '#2d2d2d',
        borderTop: '2px solid #555',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.2)'
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isListening ? t('chat.listening') : (t('chat.placeholder') || 'Type your message here...')}
          disabled={isLoading || isListening}
          style={{
            flex: 1,
            padding: '12px 15px',
            background: isListening ? '#2a4a2a' : '#1e1e1e',
            border: isListening ? '2px solid #4ade80' : '2px solid #007bff',
            borderRadius: '8px',
            color: 'white',
            fontSize: '15px',
            transition: 'all 0.3s ease',
            outline: 'none'
          }}
          onFocus={(e) => {
            if (!isListening) {
              e.target.style.borderColor = '#0056b3';
              e.target.style.boxShadow = '0 0 8px rgba(0, 123, 255, 0.5)';
            }
          }}
          onBlur={(e) => {
            if (!isListening) {
              e.target.style.borderColor = '#007bff';
              e.target.style.boxShadow = 'none';
            }
          }}
        />
        <button
          onClick={toggleVoiceInput}
          disabled={isLoading || isSpeaking}
          title={isListening ? "Stop listening" : "Start voice input (Click to speak)"}
          style={{
            padding: '12px 15px',
            background: isListening ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: (isLoading || isSpeaking) ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '50px',
            height: '45px',
            animation: isListening ? 'pulse 1.5s infinite' : 'none',
            transition: 'all 0.3s ease',
            boxShadow: isListening ? '0 0 10px rgba(220, 53, 69, 0.5)' : '0 2px 4px rgba(0, 0, 0, 0.2)'
          }}
          onMouseEnter={(e) => {
            if (!isLoading && !isSpeaking) {
              e.target.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
          }}
        >
          {isListening ? '⏹' : '🎤'}
        </button>
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim() || isListening}
          style={{
            padding: '12px 24px',
            background: isLoading ? '#555' : (!input.trim() || isListening ? '#6c757d' : '#007bff'),
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: (isLoading || !input.trim() || isListening) ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '15px',
            height: '45px',
            transition: 'all 0.3s ease',
            boxShadow: (!isLoading && input.trim() && !isListening) ? '0 2px 8px rgba(0, 123, 255, 0.4)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (!isLoading && input.trim() && !isListening) {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.6)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = (!isLoading && input.trim() && !isListening) ? '0 2px 8px rgba(0, 123, 255, 0.4)' : 'none';
          }}
        >
          {isLoading ? '⏳' : `📤 ${t('chat.send')}`}
        </button>
      </div>
      {isListening && (
        <div style={{
          padding: '10px',
          background: '#2a4a2a',
          borderTop: '2px solid #4ade80',
          textAlign: 'center',
          color: '#4ade80',
          fontSize: '14px',
          fontWeight: 'bold',
          animation: 'pulse 1.5s infinite',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}>
          <span style={{
            display: 'inline-block',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#4ade80',
            animation: 'pulse 1s infinite'
          }}></span>
          🎤 {t('chat.listening')} {t('common.speakNow', 'Speak now...')}
        </div>
      )}
    </div>
  );
};

export default ChatInterface;

