export interface InterviewQuestion {
  id: number;
  question: string;
  category: string;
}

export interface AppreciationResponse {
  responses: string[];
}

export const interviewQuestions: InterviewQuestion[] = [
  {
    id: 1,
    question: "Tell me about yourself and your background.",
    category: "introduction"
  },
  {
    id: 2,
    question: "What are your greatest strengths?",
    category: "personal"
  },
  {
    id: 3,
    question: "Where do you see yourself in 5 years?",
    category: "career"
  },
  {
    id: 4,
    question: "Why are you interested in this position?",
    category: "motivation"
  },
  {
    id: 5,
    question: "Describe a challenging situation you faced and how you handled it.",
    category: "experience"
  },
  {
    id: 6,
    question: "What motivates you to do your best work?",
    category: "motivation"
  },
  {
    id: 7,
    question: "How do you handle working under pressure?",
    category: "skills"
  },
  {
    id: 8,
    question: "What are your salary expectations?",
    category: "practical"
  },
  {
    id: 9,
    question: "Do you have any questions for us?",
    category: "closing"
  }
];

export const appreciationResponses: AppreciationResponse = {
  responses: [
    "Thank you for that thoughtful answer.",
    "That's a great perspective, I appreciate your honesty.",
    "Excellent response, thank you for sharing.",
    "Very insightful, I can see you've given this some thought.",
    "Thank you for that detailed explanation.",
    "That's a wonderful example, thank you.",
    "I appreciate your transparency in that answer.",
    "Great answer, that shows good self-awareness.",
    "Thank you for sharing your experience with us.",
    "That's exactly the kind of thinking we're looking for."
  ]
};

export const getRandomAppreciation = (): string => {
  const randomIndex = Math.floor(Math.random() * appreciationResponses.responses.length);
  return appreciationResponses.responses[randomIndex];
};