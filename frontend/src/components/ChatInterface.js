import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import speechService from '../services/speechService';
import { t } from '../i18n/languages';
import './ChatInterface.css';

const ChatInterface = ({ apiUrl, onInterviewerMessage, onSpeakingStateChange, onSpeechTextChange, onCodingQuestion }) => {
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
      
      // Check if it's a coding question
      const isCodingQuestion = res.data.is_coding_question || false;
      const suggestedLanguage = res.data.suggested_language || 'python';
      
      if (onInterviewerMessage) {
        onInterviewerMessage(res.data.reply, isCodingQuestion, suggestedLanguage);
      }
      
      if (onCodingQuestion && isCodingQuestion) {
        onCodingQuestion(res.data.reply, suggestedLanguage);
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
    <>
      <div className="chat__messages">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`chat__message ${m.sender === 'user' ? 'chat__message--user' : 'chat__message--ai'}`}
          >
            {m.sender === 'ai' && (
              <div className="chat__avatar">👨‍💼</div>
            )}
            <div className="chat__bubble">
              {m.text}
            </div>
            {m.sender === 'user' && (
              <div className="chat__avatar">👤</div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="chat__loading">
            <div className="chat__loading-dot"></div>
            <div className="chat__loading-dot"></div>
            <div className="chat__loading-dot"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat__input-area">
        <div className="chat__input-wrapper">
          <input
            className="chat__input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? t('chat.listening') : (t('chat.placeholder') || 'Type your message here...')}
            disabled={isLoading || isListening}
          />
        </div>
        <div className="chat__actions">
          <button
            className={`chat__btn chat__btn--mic ${isListening ? 'active' : ''}`}
            onClick={toggleVoiceInput}
            disabled={isLoading || isSpeaking}
            title={isListening ? "Stop listening" : "Start voice input (Click to speak)"}
          >
            {isListening ? '⏹' : '🎤'}
          </button>
          <button
            className="chat__btn chat__btn--send"
            onClick={sendMessage}
            disabled={isLoading || !input.trim() || isListening}
          >
            {isLoading ? '⏳' : `📤 ${t('chat.send')}`}
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatInterface;

