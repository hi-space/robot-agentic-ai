export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isError?: boolean;
  isTyping?: boolean;
}

