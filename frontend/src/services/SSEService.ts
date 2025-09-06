export interface SSEMessage {
  type: 'message' | 'typing' | 'error' | 'complete' | 'partial' | 'task';
  content?: string;
  sender?: 'user' | 'ai';
  timestamp?: string;
  isError?: boolean;
  messageId?: string;
  taskData?: {
    id?: string;
    title?: string;
    description?: string;
    status?: 'pending' | 'in_progress' | 'completed' | 'failed';
    type?: 'command' | 'action' | 'response';
    timestamp?: string;
    progress?: number;
    metadata?: Record<string, any>;
  };
}

export class SSEService {
  private eventSource: EventSource | null = null;
  private baseURL: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = `${this.baseURL}/api/stream`;
        this.eventSource = new EventSource(url);

        this.eventSource.onopen = () => {
          console.log('SSE connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.eventSource.onerror = (error) => {
          console.error('SSE connection error:', error);
          this.handleReconnect();
          reject(error);
        };

        this.eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing SSE message:', error);
          }
        };

      } catch (error) {
        console.error('Failed to create SSE connection:', error);
        reject(error);
      }
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`Attempting to reconnect SSE in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(console.error);
      }, delay);
    } else {
      console.error('Max SSE reconnection attempts reached');
    }
  }

  private handleMessage(data: SSEMessage) {
    // This will be overridden by the component using this service
    console.log('SSE message received:', data);
  }

  sendMessage(content: string): Promise<void> {
    return fetch(`${this.baseURL}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: content,
        timestamp: new Date().toISOString(),
        sender: 'user',
      }),
    }).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    }).then(text => {
      // Process streaming response
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing streaming data:', error);
          }
        }
      }
    });
  }

  sendVoiceMessage(audioBlob: Blob): Promise<void> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice-message.wav');
    
    return fetch(`${this.baseURL}/api/voice/stream`, {
      method: 'POST',
      body: formData,
    }).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    }).then(text => {
      // Process streaming response
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing streaming data:', error);
          }
        }
      }
    });
  }

  onMessage(callback: (message: SSEMessage) => void): void {
    if (this.eventSource) {
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          callback(data);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };
    }
  }

  onError(callback: (error: string) => void): void {
    if (this.eventSource) {
      this.eventSource.onerror = (event) => {
        callback('SSE connection error');
      };
    }
  }

  onConnect(callback: () => void): void {
    if (this.eventSource) {
      this.eventSource.onopen = callback;
    }
  }

  onDisconnect(callback: (reason: string) => void): void {
    if (this.eventSource) {
      this.eventSource.onerror = () => {
        callback('SSE disconnected');
      };
    }
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}

