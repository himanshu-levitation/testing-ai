'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { AIInterviewer } from '@/lib/ai-interviewer';

type InterviewState = 'waiting' | 'asking' | 'listening' | 'processing' | 'completed' | 'error';

export default function Home() {
  const [interviewState, setInterviewState] = useState<InterviewState>('waiting');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [aiApiKey, setAiApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const aiInterviewerRef = useRef<AIInterviewer | null>(null);
  const { speak, isSpeaking } = useTextToSpeech();

  useEffect(() => {
    // Check if API key is available
    const envApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY;
    if (!envApiKey) {
      setShowApiKeyInput(true);
    } else {
      setAiApiKey(envApiKey);
    }
  }, []);

  // Speech recognition with handler
  const handleSpeechEnd = useCallback(async (transcript: string) => {
    console.log('Speech ended with transcript:', transcript);
    
    if (transcript.trim() && aiInterviewerRef.current) {
      setInterviewState('processing');
      
      try {
        // Generate appreciation for the answer
        const appreciation = await aiInterviewerRef.current.generateAppreciation(transcript);
        await speak(appreciation);
        
        // Generate next question
        const nextQuestion = await aiInterviewerRef.current.generateNextQuestion(transcript, currentQuestion);
        
        if (aiInterviewerRef.current.getQuestionNumber() > 7) {
          setInterviewState('completed');
          setTimeout(() => {
            speak("Thank you for taking the time to interview with us today. We&apos;ll be in touch soon with next steps.");
          }, 1500);
        } else {
          setQuestionCount(aiInterviewerRef.current.getQuestionNumber());
          setCurrentQuestion(nextQuestion);
          setTimeout(() => {
            // Call askQuestion through ref to avoid circular dependency
            if (askQuestionRef.current) {
              askQuestionRef.current(nextQuestion);
            }
          }, 1500);
        }
      } catch (error) {
        console.error('Error processing speech:', error);
        setErrorMessage('Error processing your response. Please try again.');
        setInterviewState('error');
      }
    }
  }, [currentQuestion, speak]);

  const speechRecognition = useSpeechRecognition(handleSpeechEnd, 2500);
  const askQuestionRef = useRef<((question: string) => Promise<void>) | null>(null);

  const askQuestion = useCallback(async (question: string) => {
    setInterviewState('asking');
    
    try {
      await speak(question);
      setInterviewState('listening');
      speechRecognition.resetTranscript();
      speechRecognition.startListening();
    } catch (error) {
      console.error('Error speaking question:', error);
      setErrorMessage('Error speaking question. Please check your audio settings.');
      setInterviewState('error');
    }
  }, [speak, speechRecognition]);

  // Set the ref to the function
  askQuestionRef.current = askQuestion;

  const startInterview = useCallback(async () => {
    if (!speechRecognition.isSupported) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (!aiApiKey) {
      setShowApiKeyInput(true);
      return;
    }

    try {
      // Initialize AI interviewer with API key
      aiInterviewerRef.current = new AIInterviewer('general', aiApiKey);
      
      setIsInterviewStarted(true);
      setInterviewState('asking');
      setErrorMessage('');
      
      // Welcome message
      await speak("Welcome to your Groq-powered AI interview. I&apos;ll be asking you personalized questions based on your responses using fast Llama3 models. Please speak clearly and take your time. Let&apos;s begin.");
      
      // Generate and ask first question
      const firstQuestion = await aiInterviewerRef.current.generateFirstQuestion();
      setCurrentQuestion(firstQuestion);
      setQuestionCount(1);
      setTimeout(() => askQuestion(firstQuestion), 1500);
      
    } catch (error) {
      console.error('Error starting interview:', error);
      setErrorMessage('Failed to start interview. Please check your Groq API key and try again.');
      setInterviewState('error');
    }
  }, [speechRecognition.isSupported, speak, askQuestion, aiApiKey]);

  const handleApiKeySubmit = useCallback(() => {
    if (aiApiKey.trim()) {
      setShowApiKeyInput(false);
      startInterview();
    }
  }, [aiApiKey, startInterview]);

  const retryInterview = useCallback(() => {
    setInterviewState('waiting');
    setErrorMessage('');
    setIsInterviewStarted(false);
    setCurrentQuestion('');
    setQuestionCount(0);
    if (aiInterviewerRef.current) {
      aiInterviewerRef.current.reset();
    }
  }, []);

  // Visual indicators for different states
  const getStateDisplay = () => {
    switch (interviewState) {
      case 'waiting':
        return {
          title: 'AI Interview Ready',
          subtitle: 'Real-time AI-powered interview experience',
          indicator: '🤖',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-900'
        };
      case 'asking':
        return {
          title: 'AI Interviewer Speaking',
          subtitle: 'Listen carefully to the personalized question...',
          indicator: '🗣️',
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-900'
        };
      case 'listening':
        return {
          title: 'Your Turn to Speak',
          subtitle: 'Share your thoughts naturally...',
          indicator: '👂',
          bgColor: 'bg-green-50',
          textColor: 'text-green-900'
        };
      case 'processing':
        return {
          title: 'AI Processing Response',
          subtitle: 'Analyzing your answer and generating next question...',
          indicator: '🧠',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-900'
        };
      case 'completed':
        return {
          title: 'Interview Completed',
          subtitle: 'Thank you for the engaging conversation!',
          indicator: '✅',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-900'
        };
      case 'error':
        return {
          title: 'Error Occurred',
          subtitle: 'Something went wrong during the interview',
          indicator: '❌',
          bgColor: 'bg-red-50',
          textColor: 'text-red-900'
        };
      default:
        return {
          title: 'AI Interview',
          subtitle: '',
          indicator: '🤖',
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

          {/* API Key Input */}
          {showApiKeyInput && (
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Groq API Key Required</h3>
                <p className="text-gray-600 mb-4">
                  To enable AI-powered questions, please enter your Groq API key. 
                  You can get one free at <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Groq Console</a>.
                </p>
                <div className="flex gap-4">
                  <input
                    type="password"
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleApiKeySubmit}
                    disabled={!aiApiKey.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200"
                  >
                    Start Interview
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Start Interview Button */}
          {!isInterviewStarted && !showApiKeyInput && (
            <div className="text-center mb-8">
              <button
                onClick={startInterview}
                disabled={!speechRecognition.isSupported}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors duration-200 shadow-lg"
              >
                {speechRecognition.isSupported ? 'Start AI Interview' : 'Speech Recognition Not Supported'}
              </button>
              {!speechRecognition.isSupported && (
                <p className="text-red-600 mt-4">
                  Please use a supported browser (Chrome, Edge, or Safari) for speech recognition.
                </p>
              )}
            </div>
          )}

          {/* Error Display */}
          {interviewState === 'error' && (
            <div className="mb-8">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p className="font-bold">Error:</p>
                <p>{errorMessage}</p>
                <button
                  onClick={retryInterview}
                  className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Interview Progress */}
          {isInterviewStarted && interviewState !== 'error' && (
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-gray-500">
                    Question {questionCount}
                  </span>
                  <span className="text-sm font-medium text-gray-500">
                    AI Interview in Progress
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {/* Current Question Display */}
          {isInterviewStarted && currentQuestion && interviewState !== 'error' && (
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Current Question:</h3>
                <p className="text-xl text-gray-900">
                  {currentQuestion}
                </p>
              </div>
            </div>
          )}

          {/* Live Transcript Display */}
          {speechRecognition.isListening && (
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-700">Your Response:</h3>
                  <div className="text-sm text-gray-500">
                    Confidence: {Math.round(speechRecognition.confidence * 100)}%
                  </div>
                </div>
                <div className="min-h-[100px] p-4 bg-gray-50 rounded border">
                  <p className="text-gray-900">
                    {speechRecognition.transcript || 'Listening...'}
                    {speechRecognition.isListening && <span className="animate-pulse">|</span>}
                  </p>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Speak naturally. Advanced AI will detect when you finish speaking.
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
            <div className={`flex items-center space-x-2 ${speechRecognition.isListening ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-3 h-3 rounded-full ${speechRecognition.isListening ? 'bg-green-600 animate-pulse' : 'bg-gray-300'}`}></div>
              <span>Listening</span>
            </div>
            <div className={`flex items-center space-x-2 ${interviewState === 'processing' ? 'text-yellow-600' : 'text-gray-400'}`}>
              <div className={`w-3 h-3 rounded-full ${interviewState === 'processing' ? 'bg-yellow-600 animate-pulse' : 'bg-gray-300'}`}></div>
              <span>AI Processing</span>
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
                  You completed a {questionCount}-question AI-powered interview. The AI adapted its questions based on your responses in real-time.
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
