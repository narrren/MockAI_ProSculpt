// Speech-to-Text and Text-to-Speech Service

class SpeechService {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.isSpeaking = false;
    this.currentUtterance = null;
    
    // Initialize Speech Recognition
    this.initSpeechRecognition();
  }

  initSpeechRecognition() {
    // Don't initialize here - wait until it's actually needed
    // This allows for better error handling and works better with Chrome
    console.log('Speech Recognition will be initialized on first use');
  }

  // Start listening for speech
  startListening(onResult, onError) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      if (onError) {
        onError('Speech recognition not supported in this browser. Please use Chrome or Edge.');
      }
      return false;
    }

    // Stop any existing recognition
    if (this.isListening && this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore errors when stopping
      }
    }

    // Check secure context
    if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      if (onError) {
        onError('Speech recognition requires HTTPS or localhost. Please access the app via https:// or localhost.');
      }
      return false;
    }

    // Create a NEW recognition instance each time to avoid state issues
    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;  // Stop after getting a result
      this.recognition.interimResults = true;  // Show interim results for better UX
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
      console.log('Speech Recognition instance created successfully');
    } catch (error) {
      console.error('Failed to create Speech Recognition instance:', error);
      if (onError) {
        onError(`Failed to initialize speech recognition: ${error.message}`);
      }
      return false;
    }

    let finalTranscript = '';
    let interimTranscript = '';
    let hasReceivedResult = false;

    this.recognition.onresult = (event) => {
      console.log('Speech recognition result event:', event);
      hasReceivedResult = true;
      finalTranscript = '';
      interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
          console.log('Final transcript:', finalTranscript);
        } else {
          interimTranscript += transcript;
          console.log('Interim transcript:', interimTranscript);
        }
      }
      
      // If we have final results, call onResult
      if (finalTranscript.trim() && onResult) {
        console.log('Calling onResult with:', finalTranscript.trim());
        onResult(finalTranscript.trim());
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error, event);
      this.isListening = false;
      if (onError) {
        onError(event.error);
      }
    };

    this.recognition.onend = () => {
      console.log('Speech recognition ended');
      this.isListening = false;
      // If we got a result but it wasn't final, still send it
      if (hasReceivedResult && finalTranscript.trim() && onResult) {
        console.log('Sending non-final transcript:', finalTranscript.trim());
        onResult(finalTranscript.trim());
      } else if (!hasReceivedResult && onError) {
        // Only call error if we didn't get any result at all
        console.log('No speech detected');
      }
    };
    
    this.recognition.onstart = () => {
      console.log('Speech recognition started');
      this.isListening = true;
    };
    
    this.recognition.onnomatch = () => {
      console.log('No speech was recognized');
    };
    
    this.recognition.onspeechstart = () => {
      console.log('Speech has been detected');
    };
    
    this.recognition.onspeechend = () => {
      console.log('Speech has ended');
    };

    try {
      console.log('Starting speech recognition...');
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      this.isListening = false;
      if (onError) {
        if (error.message && error.message.includes('already started')) {
          onError('Speech recognition is already running. Please wait.');
        } else {
          onError('Failed to start microphone. Please check permissions.');
        }
      }
      return false;
    }
  }

  // Stop listening
  stopListening() {
    if (this.recognition) {
      try {
        if (this.isListening) {
          this.recognition.stop();
        }
        this.recognition = null; // Clear the recognition object to allow fresh start
        this.isListening = false;
        console.log('Speech recognition stopped');
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
        this.isListening = false;
      }
    }
  }

  // Speak text using Text-to-Speech
  speak(text, onStart, onEnd, onError) {
    // Stop any current speech
    this.stopSpeaking();

    if (!this.synthesis) {
      if (onError) {
        onError('Text-to-speech not supported');
      }
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    // Try to use a more natural voice
    const voices = this.synthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft') ||
      voice.name.includes('Natural')
    ) || voices.find(voice => voice.lang.startsWith('en'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (onStart) {
        onStart();
      }
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) {
        onEnd();
      }
    };

    utterance.onerror = (event) => {
      this.isSpeaking = false;
      console.error('Speech synthesis error:', event.error);
      if (onError) {
        onError(event.error);
      }
    };

    this.currentUtterance = utterance;
    this.synthesis.speak(utterance);
  }

  // Stop speaking
  stopSpeaking() {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.cancel();
      this.isSpeaking = false;
    }
  }

  // Check if speech recognition is available
  isRecognitionAvailable() {
    // Check if the API exists in the browser
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      return false;
    }
    
    // Check if we're on a secure context (HTTPS or localhost)
    if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      console.warn('Speech Recognition requires HTTPS or localhost');
      return false;
    }
    
    // Try to create an instance to verify it works
    try {
      const testRecognition = new SpeechRecognition();
      return true;
    } catch (error) {
      console.error('Speech Recognition test failed:', error);
      return false;
    }
  }

  // Check if text-to-speech is available
  isSynthesisAvailable() {
    return this.synthesis !== null;
  }
}

// Create singleton instance
const speechService = new SpeechService();

export default speechService;

