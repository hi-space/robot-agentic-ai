import axios, { AxiosInstance } from 'axios';

export class ApiService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async sendMessage(content: string): Promise<{ content: string }> {
    try {
      const response = await this.client.post('/api/chat', {
        message: content,
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw new Error('Failed to send message to AI agent');
    }
  }

  async sendVoiceMessage(audioBlob: Blob): Promise<{ content: string }> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-message.wav');
      
      const response = await this.client.post('/api/voice', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Voice API Error:', error);
      throw new Error('Failed to send voice message to AI agent');
    }
  }

  async getRecommendedCommands(): Promise<string[]> {
    try {
      const response = await this.client.get('/api/commands/recommended');
      return response.data.commands || [];
    } catch (error) {
      console.error('Commands API Error:', error);
      return [
        '오늘 날씨는 어때?',
        '할 일 목록을 만들어줘',
        '이메일을 작성해줘',
        '일정을 확인해줘',
        '뉴스를 요약해줘',
      ];
    }
  }
}

