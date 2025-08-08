# AI Interview - Real-time AI-Powered Interview Experience

A Next.js application that provides a real-time AI interview experience using **streaming Voice Activity Detection (VAD)**, speech recognition, text-to-speech, and Groq's fast Llama3 models for dynamic question generation.

## Features

🤖 **AI-Powered Questions**: Dynamic question generation using Groq's Llama3-8b-8192 model
🎙️ **Streaming VAD**: Real-time voice activity detection for precise end-of-turn detection
🗣️ **Text-to-Speech**: Natural-sounding AI interviewer voice
📊 **Real-time Feedback**: Live confidence scoring, VAD probability, and transcript display
🎯 **Adaptive Interview**: Questions adapt based on previous responses
✨ **Clean UI**: Modern, responsive interface with state-based visual feedback
⚡ **Fast & Free**: Powered by Groq's lightning-fast inference
🔄 **Continuous Streaming**: No buttons needed - automatic speech end detection

## Prerequisites

- Node.js 18+ 
- Modern web browser with **full microphone support** (Chrome or Edge recommended)
- Groq API key (get one FREE at [Groq Console](https://console.groq.com/keys))

## Getting Started

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd ai-interview
   npm install
   ```

2. **Set up your Groq API key:**
   
   Option A: Environment variable (recommended for development)
   ```bash
   # Create .env.local file
   echo "NEXT_PUBLIC_GROQ_API_KEY=your_groq_api_key_here" > .env.local
   ```
   
   Option B: Enter during application startup (the app will prompt you)

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## How It Works

### 1. Streaming Voice Activity Detection (VAD)
- Uses `@ricky0123/vad-web` for real-time voice activity detection
- Continuous audio stream analysis for speech patterns
- Automatic end-of-turn detection without silence timeouts
- Configurable thresholds for speech start/end detection
- Real-time probability scoring for voice activity

### 2. Enhanced Speech Recognition
- Combines Web Speech API with VAD for maximum accuracy
- Dual-layer detection: VAD for activity + Speech API for transcription
- Automatic speech end detection based on voice patterns
- Confidence scoring and live transcript updates
- Minimum speech duration validation

### 3. AI Question Generation
- Powered by Groq's Llama3-8b-8192 model
- Context-aware questions based on conversation history
- Dynamic follow-up questions that reference previous answers
- Professional interview question types covering:
  - Background and experience
  - Skills and strengths
  - Motivation and goals
  - Problem-solving scenarios

### 4. Real-time Interaction Flow
```
Start Interview → AI Welcome → Generate Question → Speak Question → 
[VAD STARTS] → Listen with Real-time VAD → Detect Speech End → 
Process Response → Generate Appreciation → Generate Next Question → 
Repeat (7 questions) → End Interview
```

## Technical Architecture

### Key Components

- **`AIInterviewer`**: Core AI logic for question generation and conversation management
- **`useStreamingVAD`**: Real-time voice activity detection hook
- **`useEnhancedSpeechRecognition`**: Enhanced speech recognition with VAD integration
- **`useTextToSpeech`**: Custom hook for browser text-to-speech functionality
- **`Interview Page`**: Main React component orchestrating the interview flow

### Technologies Used

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **AI**: Groq Llama3-8b-8192 API (FREE!)
- **VAD**: @ricky0123/vad-web (WebRTC-based VAD)
- **Speech**: Web Speech API (SpeechRecognition & SpeechSynthesis)
- **Audio**: Web Audio API for real-time audio processing
- **Build**: ESLint, TypeScript compiler

## Configuration

### Environment Variables

```bash
# Groq API Key (required) - FREE!
NEXT_PUBLIC_GROQ_API_KEY=gsk_your-key-here
# or
GROQ_API_KEY=gsk_your-key-here
```

### VAD Configuration

You can customize the voice activity detection in `useStreamingVAD.ts`:

```typescript
// VAD thresholds
const vadConfig = {
  positiveSpeechThreshold: 0.8,    // Threshold for speech detection
  negativeSpeechThreshold: 0.3,    // Threshold for silence detection
  redemptionFrames: 8,             // Frames to wait before ending speech
  frameSamples: 1536,              // Audio frame size
  minSpeechFrames: 4,              // Minimum frames for valid speech
  preSpeechPadFrames: 10           // Padding before speech starts
};
```

## Browser Compatibility

| Browser | VAD Support | Speech Recognition | Text-to-Speech | Status |
|---------|-------------|-------------------|----------------|--------|
| Chrome | ✅ | ✅ | ✅ | **Fully Supported** |
| Edge | ✅ | ✅ | ✅ | **Fully Supported** |
| Safari | ⚠️ | ✅ | ✅ | Limited VAD Support |
| Firefox | ❌ | ❌ | ✅ | Not Supported |

**Note**: For best results, use Chrome or Edge with microphone permissions granted.

## Usage Tips

1. **Microphone Setup**: Ensure your microphone is working and permissions are granted
2. **Quiet Environment**: Use in a quiet environment for best speech recognition
3. **Speaking Style**: Speak clearly and naturally, pause briefly between thoughts
4. **API Key**: Keep your OpenAI API key secure and don't commit it to version control

## Development

### Build for Production
```bash
npm run build
npm run start
```

### Linting and Type Checking
```bash
npm run lint
npm run type-check
```

### Project Structure
```
ai-interview/
├── app/
│   ├── page.tsx              # Main interview page
│   ├── layout.tsx            # App layout
│   └── globals.css           # Global styles
├── hooks/
│   ├── useTextToSpeech.ts    # TTS custom hook
│   └── useSpeechRecognition.ts # Speech recognition hook
├── lib/
│   └── ai-interviewer.ts     # AI interviewer logic
├── types/
│   └── speech.d.ts           # Speech API type definitions
└── public/                   # Static assets
```

## Troubleshooting

### Common Issues

1. **Speech Recognition Not Working**
   - Check browser compatibility
   - Ensure microphone permissions are granted
   - Try refreshing the page

2. **API Errors**
   - Verify your Groq API key is correct
   - Check your Groq account has available quota
   - Ensure network connectivity

3. **Audio Issues**
   - Check system audio settings
   - Try using headphones to prevent feedback
   - Ensure speakers/headphones are working

### Debug Mode

Enable console logging to see detailed speech recognition events:
```javascript
// In browser console
localStorage.setItem('debug', 'true');
```

## Security Notes

- API keys are handled client-side for simplicity
- For production use, consider implementing server-side API calls
- Never commit API keys to version control
- Use environment variables for sensitive configuration
- Groq provides free tier with generous quotas

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Groq for providing fast, free AI inference
- Web Speech API contributors
- Next.js team for the excellent framework
- Tailwind CSS for the styling system
