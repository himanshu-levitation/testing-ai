import { useState, useCallback, useRef } from 'react';

export interface UseTextToSpeechReturn {
  speak: (text: string) => Promise<void>;
  isLoading: boolean;
  isSpeaking: boolean;
  stop: () => void;
}

export const useTextToSpeech = (): UseTextToSpeechReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback(async (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!window.speechSynthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Stop any ongoing speech
      window.speechSynthesis.cancel();

      setIsLoading(true);
      
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      // Configure voice settings
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Find a natural-sounding voice
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        (voice.name.includes('Natural') || voice.name.includes('Enhanced') || voice.default)
      );
      
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onstart = () => {
        setIsLoading(false);
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsLoading(false);
        resolve();
      };

      utterance.onerror = (event) => {
        setIsSpeaking(false);
        setIsLoading(false);
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      // Ensure voices are loaded before speaking
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.speak(utterance);
        };
      } else {
        window.speechSynthesis.speak(utterance);
      }
    });
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  return {
    speak,
    isLoading,
    isSpeaking,
    stop
  };
};