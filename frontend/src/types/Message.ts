export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isError?: boolean;
  isTyping?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  type: 'command' | 'action' | 'response';
  timestamp: Date;
  progress?: number; // 0-100
  metadata?: Record<string, any>;
}

