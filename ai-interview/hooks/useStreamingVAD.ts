import { useState, useCallback, useRef, useEffect } from 'react';
import { MicVAD, utils } from '@ricky0123/vad-web';

export interface UseStreamingVADReturn {
  isListening: boolean;
  isVADSupported: boolean;
  isSpeaking: boolean;
  vadProbability: number;
  startListening: () => Promise<void>;
  stopListening: () => void;
  error: string | null;
}

export const useStreamingVAD = (
  onSpeechStart?: () => void,
  onSpeechEnd?: () => void,
  onSpeaking?: (probability: number) => void,
  vadConfig?: {
    positiveSpeechThreshold?: number;
    negativeSpeechThreshold?: number;
    redemptionFrames?: number;
    frameSamples?: number;
  }
): UseStreamingVADReturn => {
  const [isListening, setIsListening] = useState(false);
  const [isVADSupported, setIsVADSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [vadProbability, setVadProbability] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const vadRef = useRef<MicVAD | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isInitializedRef = useRef(false);

  // VAD configuration with sensible defaults
  const config = {
    positiveSpeechThreshold: vadConfig?.positiveSpeechThreshold ?? 0.8,
    negativeSpeechThreshold: vadConfig?.negativeSpeechThreshold ?? 0.3,
    redemptionFrames: vadConfig?.redemptionFrames ?? 8,
    frameSamples: vadConfig?.frameSamples ?? 1536,
    ...vadConfig
  };

  useEffect(() => {
    const initializeVAD = async () => {
      try {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
          return;
        }

        // Check for required APIs
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.warn('MediaDevices API not supported');
          setError('Microphone access not supported in this browser');
          return;
        }

        if (!window.AudioContext && !(window as any).webkitAudioContext) {
          console.warn('Web Audio API not supported');
          setError('Audio processing not supported in this browser');
          return;
        }

        setIsVADSupported(true);
        console.log('VAD support detected');
        
      } catch (error) {
        console.error('Error initializing VAD:', error);
        setError('Failed to initialize voice activity detection');
        setIsVADSupported(false);
      }
    };

    initializeVAD();

    return () => {
      if (vadRef.current) {
        vadRef.current.destroy();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startListening = useCallback(async (): Promise<void> => {
    if (!isVADSupported) {
      throw new Error('VAD not supported');
    }

    if (isListening) {
      console.warn('Already listening');
      return;
    }

    try {
      setError(null);
      setIsListening(true);

      console.log('Initializing MicVAD...');
      
      // Create VAD instance with configuration
      vadRef.current = await MicVAD.new({
        positiveSpeechThreshold: config.positiveSpeechThreshold,
        negativeSpeechThreshold: config.negativeSpeechThreshold,
        redemptionFrames: config.redemptionFrames,
        frameSamples: config.frameSamples,
        preSpeechPadFrames: 10,
        minSpeechFrames: 4,
        
        onSpeechStart: () => {
          console.log('🎤 Speech started');
          setIsSpeaking(true);
          if (onSpeechStart) {
            onSpeechStart();
          }
        },
        
        onSpeechEnd: () => {
          console.log('🔇 Speech ended');
          setIsSpeaking(false);
          setVadProbability(0);
          if (onSpeechEnd) {
            onSpeechEnd();
          }
        },
        
        onVADMisfire: () => {
          console.log('🔥 VAD misfire detected');
          setIsSpeaking(false);
          setVadProbability(0);
        },
        
        onFrameProcessed: (probabilities: any) => {
          // Get the latest probability
          const latestProb = Array.isArray(probabilities) 
            ? probabilities[probabilities.length - 1] 
            : (probabilities as number);
          setVadProbability(latestProb);
          
          if (onSpeaking) {
            onSpeaking(latestProb);
          }
          
          // Log for debugging (can be removed in production)
          if (latestProb > config.positiveSpeechThreshold) {
            console.log(`🗣️ Speaking detected: ${(latestProb * 100).toFixed(1)}%`);
          }
        }
      });

      console.log('✅ VAD initialized successfully');
      
      // Start the VAD
      vadRef.current.start();
      console.log('🎙️ VAD started, listening for speech...');

    } catch (error) {
      console.error('Error starting VAD:', error);
      setError(`Failed to start voice detection: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsListening(false);
      setIsSpeaking(false);
      throw error;
    }
  }, [isVADSupported, isListening, config, onSpeechStart, onSpeechEnd, onSpeaking]);

  const stopListening = useCallback(() => {
    console.log('🛑 Stopping VAD...');
    
    try {
      if (vadRef.current) {
        vadRef.current.pause();
        vadRef.current.destroy();
        vadRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('🔇 Audio track stopped');
        });
        streamRef.current = null;
      }

      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      setIsListening(false);
      setIsSpeaking(false);
      setVadProbability(0);
      console.log('✅ VAD stopped successfully');
      
    } catch (error) {
      console.error('Error stopping VAD:', error);
      setError(`Error stopping voice detection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  return {
    isListening,
    isVADSupported,
    isSpeaking,
    vadProbability,
    startListening,
    stopListening,
    error
  };
};