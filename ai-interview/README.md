# AI Interview - Real-time AI-Powered Interview Experience

A Next.js application that provides a real-time AI interview experience using speech recognition, text-to-speech, and OpenAI's GPT models for dynamic question generation.

## Features

🤖 **AI-Powered Questions**: Dynamic question generation using OpenAI's GPT-3.5-turbo
🎙️ **Speech Recognition**: Advanced speech-to-text with end-of-turn detection
🗣️ **Text-to-Speech**: Natural-sounding AI interviewer voice
📊 **Real-time Feedback**: Live confidence scoring and transcript display
🎯 **Adaptive Interview**: Questions adapt based on previous responses
✨ **Clean UI**: Modern, responsive interface with state-based visual feedback

## Prerequisites

- Node.js 18+ 
- Modern web browser with speech recognition support (Chrome, Edge, Safari)
- OpenAI API key (get one free at [OpenAI's website](https://platform.openai.com/api-keys))

## Getting Started

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd ai-interview
   npm install
   ```

2. **Set up your OpenAI API key:**
   
   Option A: Environment variable (recommended for development)
   ```bash
   # Create .env.local file
   echo "NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here" > .env.local
   ```
   
   Option B: Enter during application startup (the app will prompt you)

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## How It Works

### 1. Speech Recognition with End-of-Turn Detection
- Uses Web Speech API with enhanced end-of-turn detection
- Configurable silence timeout (default: 2.5 seconds)
- Voice Activity Detection (VAD) for better accuracy
- Confidence scoring for speech recognition quality

### 2. AI Question Generation
- Powered by OpenAI's GPT-3.5-turbo model
- Context-aware questions based on conversation history
- Dynamic follow-up questions that reference previous answers
- Professional interview question types covering:
  - Background and experience
  - Skills and strengths
  - Motivation and goals
  - Problem-solving scenarios

### 3. Real-time Interaction Flow
```
Start Interview → AI Welcome → Generate Question → Speak Question → 
Listen to Answer → Process Response → Generate Appreciation → 
Generate Next Question → Repeat (7 questions) → End Interview
```

## Technical Architecture

### Key Components

- **`AIInterviewer`**: Core AI logic for question generation and conversation management
- **`useTextToSpeech`**: Custom hook for browser text-to-speech functionality
- **`useSpeechRecognition`**: Enhanced speech recognition with end-of-turn detection
- **`Interview Page`**: Main React component orchestrating the interview flow

### Technologies Used

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-3.5-turbo API
- **Speech**: Web Speech API (SpeechRecognition & SpeechSynthesis)
- **Build**: ESLint, TypeScript compiler

## Configuration

### Environment Variables

```bash
# OpenAI API Key (required)
NEXT_PUBLIC_OPENAI_API_KEY=sk-your-key-here
# or
OPENAI_API_KEY=sk-your-key-here
```

### Speech Recognition Settings

You can customize the speech recognition behavior in `useSpeechRecognition.ts`:

```typescript
// Silence timeout for end-of-turn detection
const silenceTimeout = 2500; // milliseconds

// Minimum speech duration before considering end-of-turn
const minimumSpeechDuration = 1000; // milliseconds
```

## Browser Compatibility

| Browser | Speech Recognition | Text-to-Speech | Status |
|---------|-------------------|----------------|--------|
| Chrome | ✅ | ✅ | Fully Supported |
| Edge | ✅ | ✅ | Fully Supported |
| Safari | ✅ | ✅ | Fully Supported |
| Firefox | ❌ | ✅ | Limited Support |

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
   - Verify your OpenAI API key is correct
   - Check your OpenAI account has available credits
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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- OpenAI for the GPT API
- Web Speech API contributors
- Next.js team for the excellent framework
- Tailwind CSS for the styling system
