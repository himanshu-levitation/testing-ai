import { useState, useCallback, useRef, useEffect } from 'react';
import { useStreamingVAD } from './useStreamingVAD';

export interface UseEnhancedSpeechRecognitionReturn {
  transcript: string;
  isListening: boolean;
  isSupported: boolean;
  isSpeaking: boolean;
  confidence: number;
  vadProbability: number;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
}

export const useEnhancedSpeechRecognition = (
  onSpeechEnd?: (transcript: string) => void,
  config?: {
    endOfSpeechTimeout?: number;
    minSpeechDuration?: number;
    vadThreshold?: number;
    silenceAfterSpeechTimeout?: number;
  }
): UseEnhancedSpeechRecognitionReturn => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');
  const interimTranscriptRef = useRef('');
  const speechStartTimeRef = useRef<number>(0);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speechEndTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasCapturedSpeechRef = useRef(false);

  // Configuration with defaults
  const settings = {
    endOfSpeechTimeout: config?.endOfSpeechTimeout ?? 2000, // 2 seconds after speech ends
    minSpeechDuration: config?.minSpeechDuration ?? 800, // Minimum 800ms of speech
    vadThreshold: config?.vadThreshold ?? 0.8,
    silenceAfterSpeechTimeout: config?.silenceAfterSpeechTimeout ?? 1500, // 1.5s silence after speech
    ...config
  };

  // VAD callbacks for precise speech detection
  const handleVADSpeechStart = useCallback(() => {
    console.log('🎤 VAD: Speech started');
    speechStartTimeRef.current = Date.now();
    hasCapturedSpeechRef.current = true;
    
    // Clear any existing timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (speechEndTimerRef.current) {
      clearTimeout(speechEndTimerRef.current);
      speechEndTimerRef.current = null;
    }
  }, []);

  const handleVADSpeechEnd = useCallback(() => {
    console.log('🔇 VAD: Speech ended');
    
    const speechDuration = Date.now() - speechStartTimeRef.current;
    const hasMinimumDuration = speechDuration >= settings.minSpeechDuration;
    const hasContent = finalTranscriptRef.current.trim().length > 0;

    console.log(`Speech duration: ${speechDuration}ms, Min required: ${settings.minSpeechDuration}ms`);
    console.log(`Has content: ${hasContent}, Content: "${finalTranscriptRef.current.trim()}"`);

    if (hasMinimumDuration && hasContent && hasCapturedSpeechRef.current) {
      // Start countdown for end of speech
      speechEndTimerRef.current = setTimeout(() => {
        console.log('✅ End of speech confirmed - processing transcript');
        const finalText = finalTranscriptRef.current.trim();
        
        if (finalText && onSpeechEnd) {
          stopListening();
          onSpeechEnd(finalText);
        }
      }, settings.silenceAfterSpeechTimeout);
    }
  }, [onSpeechEnd, settings.minSpeechDuration, settings.silenceAfterSpeechTimeout]);

  const handleVADSpeaking = useCallback((probability: number) => {
    // If speaking resumes, cancel the end timer
    if (probability > settings.vadThreshold && speechEndTimerRef.current) {
      console.log('🗣️ Speech resumed - cancelling end timer');
      clearTimeout(speechEndTimerRef.current);
      speechEndTimerRef.current = null;
    }
  }, [settings.vadThreshold]);

  // Initialize VAD
  const vad = useStreamingVAD(
    handleVADSpeechStart,
    handleVADSpeechEnd,
    handleVADSpeaking,
    {
      positiveSpeechThreshold: 0.8,
      negativeSpeechThreshold: 0.3,
      redemptionFrames: 8,
      frameSamples: 1536
    }
  );

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition && vad.isVADSupported);

    if (SpeechRecognition && vad.isVADSupported) {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      // Configure recognition settings
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('🎙️ Speech recognition started');
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        let maxConfidence = 0;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const resultTranscript = result[0].transcript;
          const resultConfidence = result[0].confidence || 0.8;

          if (result.isFinal) {
            finalTranscript += resultTranscript;
            maxConfidence = Math.max(maxConfidence, resultConfidence);
            console.log(`📝 Final transcript: "${resultTranscript}"`);
          } else {
            interimTranscript += resultTranscript;
          }
        }

        // Update confidence
        setConfidence(maxConfidence || 0.8);

        // Update transcript refs
        if (finalTranscript) {
          finalTranscriptRef.current += finalTranscript;
        }
        interimTranscriptRef.current = interimTranscript;

        // Update display transcript
        const fullTranscript = finalTranscriptRef.current + interimTranscript;
        setTranscript(fullTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        
        // Auto-restart on certain errors
        if (event.error === 'no-speech' || event.error === 'audio-capture') {
          setTimeout(() => {
            if (isListening && recognitionRef.current) {
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
        console.log('🛑 Speech recognition ended');
        setIsListening(false);
      };
    }

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (speechEndTimerRef.current) {
        clearTimeout(speechEndTimerRef.current);
      }
    };
  }, [vad.isVADSupported, isListening]);

  const startListening = useCallback(async () => {
    if (!isSupported) {
      const errorMsg = 'Speech recognition or VAD not supported';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      setError(null);
      
      // Reset state
      finalTranscriptRef.current = '';
      interimTranscriptRef.current = '';
      hasCapturedSpeechRef.current = false;
      speechStartTimeRef.current = 0;
      setTranscript('');
      setConfidence(0);

      // Clear any existing timers
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (speechEndTimerRef.current) {
        clearTimeout(speechEndTimerRef.current);
        speechEndTimerRef.current = null;
      }

      // Start VAD first
      console.log('🚀 Starting VAD...');
      await vad.startListening();

      // Then start speech recognition
      if (recognitionRef.current) {
        console.log('🚀 Starting Speech Recognition...');
        recognitionRef.current.start();
      }

      console.log('✅ Enhanced speech recognition started');
      
    } catch (error) {
      console.error('Error starting enhanced speech recognition:', error);
      setError(`Failed to start: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }, [isSupported, vad]);

  const stopListening = useCallback(() => {
    console.log('🛑 Stopping enhanced speech recognition...');

    try {
      // Stop VAD
      vad.stopListening();

      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      // Clear timers
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (speechEndTimerRef.current) {
        clearTimeout(speechEndTimerRef.current);
        speechEndTimerRef.current = null;
      }

      setIsListening(false);
      console.log('✅ Enhanced speech recognition stopped');
      
    } catch (error) {
      console.error('Error stopping enhanced speech recognition:', error);
      setError(`Error stopping: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [vad]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(0);
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    hasCapturedSpeechRef.current = false;
    speechStartTimeRef.current = 0;
  }, []);

  return {
    transcript,
    isListening: isListening && vad.isListening,
    isSupported,
    isSpeaking: vad.isSpeaking,
    confidence,
    vadProbability: vad.vadProbability,
    startListening,
    stopListening,
    resetTranscript,
    error: error || vad.error
  };
};