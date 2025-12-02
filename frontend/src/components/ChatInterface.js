import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import speechService from '../services/speechService';
import { t } from '../i18n/languages';
import './ChatInterface.css';

const ChatInterface = ({ apiUrl, onInterviewerMessage, onSpeakingStateChange, onSpeechTextChange, onCodingQuestion, isMuted = false, userId = null, avatarReady = null }) => {
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
  const initialMessageSpokenRef = useRef(false); // Track if initial message has been spoken

  // Function to speak a message
  const speakMessage = (text) => {
    // Set speech text for subtitles and avatar
    setCurrentSpeechText(text);
    if (onSpeechTextChange) {
      onSpeechTextChange(text);
    }

    setIsSpeaking(true);
    if (onSpeakingStateChange) {
      onSpeakingStateChange(true);
    }

    // Always prefer avatar over browser TTS (even if avatar is still loading)
    // This prevents the chatbot from speaking while avatar is connecting
    // The avatar will speak when it's ready via the useEffect that watches currentSpeech
    // BUT: If avatar has failed (avatarReady === false), fall back to browser TTS
    if (avatarReady === true) {
      // Avatar is ready - let it handle speech, skip browser TTS
      console.log('Avatar is ready - using avatar speech with lip sync, skipping browser TTS');
      
      // Stop any ongoing browser TTS to prevent overlap
      if (speechService.isSynthesisAvailable()) {
        speechService.stopSpeaking();
        console.log('Stopped any ongoing browser TTS to prevent overlap with avatar');
      }
      
      // Avatar will handle the speech via sendTextToAvatar
      // We just need to update the speaking state and text
      // The avatar will handle stopping the speaking state when done
      // Estimate speaking duration for state management
      const estimatedDuration = Math.min(text.length * 50, 8000); // Max 8 seconds
      setTimeout(() => {
        // Only clear if still speaking (avatar might have already cleared it)
        if (isSpeaking) {
          setIsSpeaking(false);
          setCurrentSpeechText('');
          if (onSpeakingStateChange) {
            onSpeakingStateChange(false);
          }
          if (onSpeechTextChange) {
            onSpeechTextChange('');
          }
        }
      }, estimatedDuration);
      return;
    } else if (avatarReady === null) {
      // Avatar is loading - DON'T use browser TTS yet, wait for avatar to succeed or fail
      console.log('Avatar is loading - queuing message, NOT using browser TTS yet');
      // Set speech text for subtitles (will be shown when avatar speaks)
      setCurrentSpeechText(text);
      if (onSpeechTextChange) {
        onSpeechTextChange(text);
      }
      // Message will be sent when avatar becomes ready (or browser TTS if it fails)
      // Don't clear speaking state yet - wait for avatar to resolve
      // Set a timeout to clear if avatar takes too long (10 seconds max)
      const maxWaitTimer = setTimeout(() => {
        if (avatarReady === null && isSpeaking) {
          // Avatar still loading after max wait, clear state
          console.log('Avatar still loading after max wait - clearing speaking state');
          setIsSpeaking(false);
          setCurrentSpeechText('');
          if (onSpeakingStateChange) {
            onSpeakingStateChange(false);
          }
          if (onSpeechTextChange) {
            onSpeechTextChange('');
          }
        }
      }, 10000);
      // Store timer to clear it if avatar resolves earlier
      return () => clearTimeout(maxWaitTimer);
    }
    // avatarReady === false means avatar failed, use browser TTS
    console.log('Avatar failed - using browser TTS fallback for:', text.substring(0, 50) + '...');
    
    // Set speech text for subtitles (will be shown during TTS)
    setCurrentSpeechText(text);
    if (onSpeechTextChange) {
      onSpeechTextChange(text);
    }

    // If muted, don't speak but still show subtitles
    if (isMuted) {
      console.log('Muted: Skipping speech, showing subtitles only');
      // Simulate speaking duration for subtitle display
      setTimeout(() => {
        setIsSpeaking(false);
        setCurrentSpeechText('');
        if (onSpeakingStateChange) {
          onSpeakingStateChange(false);
        }
        if (onSpeechTextChange) {
          onSpeechTextChange('');
        }
      }, Math.min(text.length * 50, 5000)); // Estimate based on text length
      return;
    }

    // Fallback to browser TTS if avatar is not ready
    if (!speechService.isSynthesisAvailable()) {
      console.warn('Text-to-speech not available');
      // Still update state for subtitles
      setTimeout(() => {
        setIsSpeaking(false);
        setCurrentSpeechText('');
        if (onSpeakingStateChange) {
          onSpeakingStateChange(false);
        }
        if (onSpeechTextChange) {
          onSpeechTextChange('');
        }
      }, Math.min(text.length * 50, 5000));
      return;
    }

    // Use browser TTS as fallback
    console.log('Calling browser TTS to speak:', text.substring(0, 50) + '...');
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
  // IMPORTANT: Only speak the initial message ONCE, and only if no other messages have been spoken
  useEffect(() => {
    // Don't speak if initial message was already spoken
    if (initialMessageSpokenRef.current) {
      return;
    }
    
    // Don't speak if there are more than 1 message (user has already responded)
    if (messages.length > 1) {
      console.log('User has already responded - skipping initial message speech');
      initialMessageSpokenRef.current = true; // Mark as spoken to prevent future triggers
      return;
    }
    
    // Wait for avatar status to be determined (loading, ready, or failed)
    // This ensures we know whether to use avatar or browser TTS
    // Only speak once, when we know the avatar status
    if (messages.length === 0 || messages[0].sender !== 'ai') {
      return;
    }

    const initialMessage = messages[0].text;
    
    // If avatar is ready, let it handle it
    if (avatarReady === true) {
      console.log('Avatar is ready - will use avatar for initial message');
      initialMessageSpokenRef.current = true; // Mark as spoken
      if (onInterviewerMessage) {
        onInterviewerMessage(initialMessage);
      }
      setTimeout(() => {
        speakMessage(initialMessage);
      }, 500);
      return;
    }
    
    // If avatar failed, use browser TTS
    if (avatarReady === false) {
      console.log('Avatar failed - using browser TTS for initial message');
      initialMessageSpokenRef.current = true; // Mark as spoken
      if (onInterviewerMessage) {
        onInterviewerMessage(initialMessage);
      }
      setTimeout(() => {
        speakMessage(initialMessage);
      }, 500);
      return;
    }
    
    // Avatar is still loading (null) - wait for it to either succeed or fail
    // Don't use browser TTS yet, wait for avatar status
    console.log('Avatar is loading - waiting for status before speaking initial message');
    if (onInterviewerMessage) {
      onInterviewerMessage(initialMessage);
    }
    
    // Set a maximum wait time (5 seconds) - if avatar hasn't resolved by then, use browser TTS
    // Reduced from 8s to 5s for faster fallback
    const maxWaitTimer = setTimeout(() => {
      // Check again if initial message should be spoken
      if (initialMessageSpokenRef.current || messages.length > 1) {
        console.log('Initial message already spoken or user responded - skipping');
        return;
      }
      
      console.log('Avatar timeout reached - forcing browser TTS activation');
      if (avatarReady === null || avatarReady === undefined) {
        // Still loading after max wait, use browser TTS as fallback
        console.log('Avatar still loading after max wait - using browser TTS fallback');
        initialMessageSpokenRef.current = true; // Mark as spoken
        speakMessage(initialMessage);
      }
    }, 5000); // Reduced to 5 seconds
    
    return () => clearTimeout(maxWaitTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarReady, messages.length]); // Re-run when avatar status changes OR when messages change

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const newMsgs = [...messages, { sender: 'user', text: userMessage }];
    setMessages(newMsgs);
    setInput('');
    setIsLoading(true);

    try {
      const res = await axios.post(`${apiUrl}/chat`, { 
        message: userMessage,
        user_id: userId  // Pass user ID to track test accounts
      });
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
      
      // Mark initial message as spoken if it wasn't already (user has responded)
      if (!initialMessageSpokenRef.current && messages.length > 0) {
        initialMessageSpokenRef.current = true;
        console.log('User responded - marking initial message as spoken to prevent overlap');
        
        // Stop any ongoing browser TTS from initial message
        if (speechService.isSynthesisAvailable()) {
          speechService.stopSpeaking();
          console.log('Stopped initial message TTS since user has responded');
        }
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
      <div className="chat__body">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`msg ${m.sender === 'user' ? 'msg--me' : 'msg--ai'}`}
          >
            <div className="msg__bubble">
              {m.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="msg msg--ai">
            <div className="msg__bubble">Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat__inputbar">
        <input
          className="chat__input input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isListening ? t('chat.listening') : (t('chat.placeholder') || 'Type your message here...')}
          disabled={isLoading || isListening}
        />
        <button
          className={`voice-btn ${isListening ? 'active' : ''}`}
          onClick={toggleVoiceInput}
          disabled={isLoading || isSpeaking}
          aria-pressed={isListening}
          title={isListening ? "Stop listening" : "Start voice input (Click to speak)"}
        >
          {isListening ? '⏹' : '🎤'}
        </button>
        <button
          className="btn btn--primary btn--sm"
          onClick={sendMessage}
          disabled={isLoading || !input.trim() || isListening}
        >
          {isLoading ? '⏳' : t('chat.send', 'Send')}
        </button>
      </div>
    </>
  );
};

export default ChatInterface;

