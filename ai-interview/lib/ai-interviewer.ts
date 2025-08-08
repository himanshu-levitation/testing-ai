import OpenAI from 'openai';

export interface ConversationTurn {
  question: string;
  answer: string;
}

export interface InterviewContext {
  conversationHistory: ConversationTurn[];
  currentQuestionNumber: number;
  interviewType: string;
}

export class AIInterviewer {
  private conversationHistory: ConversationTurn[] = [];
  private currentQuestionNumber = 0;
  private interviewType = 'general';
  private openai: OpenAI | null = null;

  constructor(interviewType: string = 'general', apiKey?: string) {
    this.interviewType = interviewType;
    
    // Get API key from multiple sources
    const key = apiKey || 
                (typeof window !== 'undefined' ? (window as typeof window & { OPENAI_API_KEY?: string }).OPENAI_API_KEY : null) ||
                process.env.NEXT_PUBLIC_OPENAI_API_KEY || 
                process.env.OPENAI_API_KEY;
    
    if (key) {
      this.openai = new OpenAI({
        apiKey: key,
        dangerouslyAllowBrowser: true
      });
    }
  }

  async generateFirstQuestion(): Promise<string> {
    const systemPrompt = `You are an AI interviewer conducting a professional job interview. Your role is to:
    1. Ask engaging, relevant interview questions
    2. Be friendly but professional
    3. Ask follow-up questions based on previous answers
    4. Keep questions concise and clear
    5. Cover different aspects: background, skills, experience, motivation, and situational questions
    
    Start with a warm opening question that helps the candidate feel comfortable.
    Keep your question under 25 words.`;

    if (!this.openai) {
      console.warn('OpenAI client not initialized, using fallback question');
      this.currentQuestionNumber = 1;
      return "Tell me about yourself and what brings you here today.";
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: "Generate the first interview question to start the conversation."
          }
        ],
        max_tokens: 100,
        temperature: 0.7,
      });

      const question = response.choices[0]?.message?.content?.trim() || "Tell me about yourself and what brings you here today.";
      this.currentQuestionNumber = 1;
      return question;
    } catch (error) {
      console.error('Error generating first question:', error);
      this.currentQuestionNumber = 1;
      return "Tell me about yourself and what brings you here today.";
    }
  }

  async generateNextQuestion(previousAnswer: string, currentQuestion: string): Promise<string> {
    // Add to conversation history
    this.conversationHistory.push({
      question: currentQuestion,
      answer: previousAnswer
    });

    this.currentQuestionNumber++;

    // If we've asked enough questions, wrap up
    if (this.currentQuestionNumber > 7) {
      return "Thank you for your thoughtful responses. Do you have any questions for us about the role or company?";
    }

    if (!this.openai) {
      console.warn('OpenAI client not initialized, using fallback question');
      return this.getFallbackQuestion();
    }

    const systemPrompt = `You are an AI interviewer conducting a professional job interview. 
    
    Based on the conversation history, generate the next appropriate interview question.
    
    Guidelines:
    - Ask relevant follow-up questions based on previous answers
    - Cover different aspects: technical skills, soft skills, experience, motivation, problem-solving
    - Be conversational and engaging
    - Keep questions under 25 words
    - Avoid repeating similar questions
    - Show that you're listening by referencing previous answers when appropriate
    
    Question number: ${this.currentQuestionNumber}`;

    const conversationContext = this.conversationHistory
      .map((turn, index) => `Q${index + 1}: ${turn.question}\nA${index + 1}: ${turn.answer}`)
      .join('\n\n');

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Previous conversation:\n${conversationContext}\n\nGenerate the next interview question.`
          }
        ],
        max_tokens: 100,
        temperature: 0.7,
      });

      const question = response.choices[0]?.message?.content?.trim() || this.getFallbackQuestion();
      return question;
    } catch (error) {
      console.error('Error generating next question:', error);
      return this.getFallbackQuestion();
    }
  }

  private getFallbackQuestion(): string {
    const fallbackQuestions = [
      "What are your greatest strengths?",
      "Where do you see yourself in 5 years?",
      "Why are you interested in this position?",
      "Describe a challenging situation you've faced.",
      "What motivates you in your work?",
      "How do you handle working under pressure?",
      "What questions do you have for us?"
    ];

    const index = Math.min(this.currentQuestionNumber - 2, fallbackQuestions.length - 1);
    return fallbackQuestions[Math.max(0, index)];
  }

  async generateAppreciation(answer: string): Promise<string> {
    if (!this.openai) {
      return this.getFallbackAppreciation();
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an AI interviewer. Generate a brief, professional acknowledgment of the candidate's answer. Keep it under 15 words and sound natural and encouraging."
          },
          {
            role: "user",
            content: `Candidate's answer: "${answer}"\n\nGenerate a brief positive acknowledgment.`
          }
        ],
        max_tokens: 50,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content?.trim() || this.getFallbackAppreciation();
    } catch (error) {
      console.error('Error generating appreciation:', error);
      return this.getFallbackAppreciation();
    }
  }

  private getFallbackAppreciation(): string {
    const appreciations = [
      "Thank you for sharing that.",
      "That's a great perspective.",
      "I appreciate your honesty.",
      "Interesting point.",
      "Thank you for that insight.",
      "Great example.",
      "That shows good thinking.",
      "I can see you've given this thought."
    ];
    return appreciations[Math.floor(Math.random() * appreciations.length)];
  }

  getQuestionNumber(): number {
    return this.currentQuestionNumber;
  }

  getConversationHistory(): ConversationTurn[] {
    return this.conversationHistory;
  }

  reset(): void {
    this.conversationHistory = [];
    this.currentQuestionNumber = 0;
  }

  isOpenAIAvailable(): boolean {
    return this.openai !== null;
  }
}