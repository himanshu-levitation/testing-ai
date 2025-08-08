'use client';

import { useState, useCallback } from 'react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { interviewQuestions, getRandomAppreciation } from '@/lib/interview-data';

type InterviewState = 'waiting' | 'asking' | 'listening' | 'appreciating' | 'completed';

export default function Home() {
  const [interviewState, setInterviewState] = useState<InterviewState>('waiting');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);

  const { speak, isSpeaking } = useTextToSpeech();

  const askNextQuestion = useCallback(async () => {
    if (currentQuestionIndex < interviewQuestions.length) {
      setInterviewState('asking');
      const question = interviewQuestions[currentQuestionIndex];
      
      try {
        await speak(question.question);
        // After speaking is done, start listening
        setInterviewState('listening');
        resetTranscript();
        startListening();
      } catch (error) {
        console.error('Error speaking question:', error);
      }
    }
  }, [currentQuestionIndex, speak, resetTranscript, startListening]);

  const handleSpeechEnd = useCallback(async (transcript: string) => {
    console.log('Speech ended with transcript:', transcript);
    
    if (transcript.trim()) {
      // Move to appreciation phase
      setInterviewState('appreciating');
      
      // Speak appreciation
      const appreciationMessage = getRandomAppreciation();
      await speak(appreciationMessage);
      
      // Move to next question or complete interview
      if (currentQuestionIndex < interviewQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setTimeout(() => askNextQuestion(), 1500); // Brief pause before next question
      } else {
        setInterviewState('completed');
        setTimeout(() => {
          speak("Thank you for taking the time to interview with us today. We&apos;ll be in touch soon with next steps.");
        }, 1500);
      }
    }
  }, [currentQuestionIndex, speak, askNextQuestion]);

  const { 
    transcript, 
    isListening, 
    isSupported, 
    startListening, 
    resetTranscript 
  } = useSpeechRecognition(handleSpeechEnd, 3000);

  const startInterview = useCallback(async () => {
    if (!isSupported) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    setIsInterviewStarted(true);
    setInterviewState('asking');
    
    // Welcome message
    await speak("Welcome to your AI interview. I&apos;ll be asking you several questions. Please speak clearly and take your time with each answer. Let&apos;s begin with the first question.");
    
    // Start with first question
    askNextQuestion();
  }, [isSupported, speak, askNextQuestion]);

  // Visual indicators for different states
  const getStateDisplay = () => {
    switch (interviewState) {
      case 'waiting':
        return {
          title: 'AI Interview Ready',
          subtitle: 'Click start when you&apos;re ready to begin',
          indicator: '🎤',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-900'
        };
      case 'asking':
        return {
          title: 'Speaking Question',
          subtitle: 'Please listen carefully...',
          indicator: '🗣️',
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-900'
        };
      case 'listening':
        return {
          title: 'Listening to Your Answer',
          subtitle: 'Please speak your answer...',
          indicator: '👂',
          bgColor: 'bg-green-50',
          textColor: 'text-green-900'
        };
      case 'appreciating':
        return {
          title: 'Processing Response',
          subtitle: 'Thank you for your answer',
          indicator: '💭',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-900'
        };
      case 'completed':
        return {
          title: 'Interview Completed',
          subtitle: 'Thank you for your time!',
          indicator: '✅',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-900'
        };
      default:
        return {
          title: 'AI Interview',
          subtitle: '',
          indicator: '🎤',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-900'
        };
    }
  };

  const stateDisplay = getStateDisplay();

  return (
    <div className={`min-h-screen transition-all duration-1000 ${stateDisplay.bgColor}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="text-6xl mb-4">{stateDisplay.indicator}</div>
            <h1 className={`text-4xl font-bold mb-4 ${stateDisplay.textColor}`}>
              {stateDisplay.title}
            </h1>
            <p className={`text-xl ${stateDisplay.textColor} opacity-80`}>
              {stateDisplay.subtitle}
            </p>
          </div>

          {/* Start Interview Button - Only visible before interview starts */}
          {!isInterviewStarted && (
            <div className="text-center mb-8">
              <button
                onClick={startInterview}
                disabled={!isSupported}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors duration-200 shadow-lg"
              >
                {isSupported ? 'Start Interview' : 'Speech Recognition Not Supported'}
              </button>
              {!isSupported && (
                <p className="text-red-600 mt-4">
                  Please use a supported browser (Chrome, Edge, or Safari) for speech recognition.
                </p>
              )}
            </div>
          )}

          {/* Interview Progress */}
          {isInterviewStarted && (
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-gray-500">
                    Question {currentQuestionIndex + 1} of {interviewQuestions.length}
                  </span>
                  <span className="text-sm font-medium text-gray-500">
                    Progress: {Math.round(((currentQuestionIndex + (interviewState === 'completed' ? 1 : 0)) / interviewQuestions.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${((currentQuestionIndex + (interviewState === 'completed' ? 1 : 0)) / interviewQuestions.length) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Current Question Display */}
          {isInterviewStarted && currentQuestionIndex < interviewQuestions.length && (
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Current Question:</h3>
                <p className="text-xl text-gray-900">
                  {interviewQuestions[currentQuestionIndex]?.question}
                </p>
              </div>
            </div>
          )}

          {/* Live Transcript Display */}
          {isListening && (
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Your Response:</h3>
                <div className="min-h-[100px] p-4 bg-gray-50 rounded border">
                  <p className="text-gray-900">
                    {transcript || 'Listening...'}
                    {isListening && <span className="animate-pulse">|</span>}
                  </p>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Speak naturally. I&apos;ll detect when you finish speaking.
                </p>
              </div>
            </div>
          )}

          {/* Status Indicators */}
          <div className="flex justify-center space-x-6 text-sm">
            <div className={`flex items-center space-x-2 ${isSpeaking ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-purple-600 animate-pulse' : 'bg-gray-300'}`}></div>
              <span>AI Speaking</span>
            </div>
            <div className={`flex items-center space-x-2 ${isListening ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-600 animate-pulse' : 'bg-gray-300'}`}></div>
              <span>Listening</span>
            </div>
          </div>

          {/* Interview Completed Message */}
          {interviewState === 'completed' && (
            <div className="mt-8 text-center">
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Interview Completed Successfully!
                </h2>
                <p className="text-gray-600 mb-6">
                  You answered all {interviewQuestions.length} questions. Thank you for your time.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Start New Interview
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
