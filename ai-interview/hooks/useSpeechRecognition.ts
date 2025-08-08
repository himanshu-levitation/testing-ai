import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseSpeechRecognitionReturn {
  transcript: string;
  isListening: boolean;
  isSupported: boolean;
  confidence: number;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export const useSpeechRecognition = (
  onSpeechEnd?: (transcript: string) => void,
  silenceTimeout: number = 2500 // Reduced to 2.5 seconds for better responsiveness
): UseSpeechRecognitionReturn => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [confidence, setConfidence] = useState(0);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const finalTranscriptRef = useRef('');
  const interimTranscriptRef = useRef('');
  const lastSpeechTimeRef = useRef<number>(0);
  const speechStartedRef = useRef(false);
  const minimumSpeechDurationRef = useRef(1000); // Minimum 1 second of speech

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      // Configure recognition settings for better performance
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        speechStartedRef.current = false;
        lastSpeechTimeRef.current = Date.now();
        console.log('Speech recognition started');
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        let maxConfidence = 0;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const resultTranscript = result[0].transcript;
          const resultConfidence = result[0].confidence;

          if (result.isFinal) {
            finalTranscript += resultTranscript;
            maxConfidence = Math.max(maxConfidence, resultConfidence);
          } else {
            interimTranscript += resultTranscript;
            // For interim results, we use a default confidence
            maxConfidence = Math.max(maxConfidence, 0.8);
          }
        }

        // Update confidence
        setConfidence(maxConfidence);

        // Update refs
        if (finalTranscript) {
          finalTranscriptRef.current += finalTranscript;
          speechStartedRef.current = true;
          lastSpeechTimeRef.current = Date.now();
        }

        if (interimTranscript && interimTranscript.trim()) {
          speechStartedRef.current = true;
          lastSpeechTimeRef.current = Date.now();
        }

        interimTranscriptRef.current = interimTranscript;

        // Update display transcript
        const fullTranscript = finalTranscriptRef.current + interimTranscript;
        setTranscript(fullTranscript);

        // Clear existing silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        // Enhanced end-of-turn detection
        const hasSubstantialContent = finalTranscriptRef.current.trim().length > 10;
        const timeSinceStart = Date.now() - lastSpeechTimeRef.current;
        const hasMinimumDuration = timeSinceStart >= minimumSpeechDurationRef.current;

        // Set new silence timer with dynamic timeout based on content
        if (finalTranscript && speechStartedRef.current && hasSubstantialContent) {
          // Shorter timeout for longer responses
          const dynamicTimeout = Math.max(
            silenceTimeout * 0.7, // Minimum 70% of original timeout
            silenceTimeout - (finalTranscriptRef.current.length / 10) * 100 // Reduce timeout based on length
          );

          silenceTimerRef.current = setTimeout(() => {
            const currentTime = Date.now();
            const timeSinceLastSpeech = currentTime - lastSpeechTimeRef.current;
            
            // Additional checks before ending
            if (
              speechStartedRef.current && 
              finalTranscriptRef.current.trim() && 
              timeSinceLastSpeech >= dynamicTimeout &&
              hasMinimumDuration
            ) {
              console.log('End-of-turn detected:', {
                transcript: finalTranscriptRef.current.trim(),
                timeSinceLastSpeech,
                hasMinimumDuration,
                confidence: maxConfidence
              });
              
              stopListening();
              if (onSpeechEnd) {
                onSpeechEnd(finalTranscriptRef.current.trim());
              }
            }
          }, Math.max(dynamicTimeout, 1000)); // Minimum 1 second timeout
        }
      };

      recognition.onspeechstart = () => {
        console.log('Speech started');
        speechStartedRef.current = true;
        lastSpeechTimeRef.current = Date.now();
      };

      recognition.onspeechend = () => {
        console.log('Speech ended by browser');
        // Don't immediately stop - let our timer handle it
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        // Clear timers on error
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        // Auto-restart on certain errors (except permission denied)
        if (event.error === 'no-speech' || event.error === 'audio-capture') {
          setTimeout(() => {
            if (recognitionRef.current && isListening) {
              try {
                recognitionRef.current.start();
              } catch (restartError) {
                console.error('Failed to restart recognition:', restartError);
              }
            }
          }, 1000);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        console.log('Speech recognition ended');
        
        // Clear timers on end
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      };
    }

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [onSpeechEnd, silenceTimeout]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      console.warn('Speech recognition not supported');
      return;
    }

    // Reset all state
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    speechStartedRef.current = false;
    lastSpeechTimeRef.current = Date.now();
    setTranscript('');
    setConfidence(0);

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      // If already running, stop and restart
      if (error instanceof Error && error.message.includes('already started')) {
        recognitionRef.current.stop();
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
          } catch (retryError) {
            console.error('Failed to restart recognition:', retryError);
          }
        }, 100);
      }
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(0);
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    speechStartedRef.current = false;
    lastSpeechTimeRef.current = Date.now();
  }, []);

  return {
    transcript,
    isListening,
    isSupported,
    confidence,
    startListening,
    stopListening,
    resetTranscript
  };
};