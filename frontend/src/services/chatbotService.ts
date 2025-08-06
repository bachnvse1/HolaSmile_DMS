import axiosInstance from '@/lib/axios';
import type { ChatbotKnowledge, UpdateChatbotRequest } from '@/types/chatbot.types';

export class ChatbotKnowledgeService {
  static async getAllKnowledge(): Promise<ChatbotKnowledge[]> {
    try {
      const response = await axiosInstance.get('/chatbot');
      return response.data;
    } catch (error) {
      console.error('Error fetching chatbot knowledge:', error);
      throw new Error('Không thể tải dữ liệu chatbot');
    }
  }

  static async updateAnswer(request: UpdateChatbotRequest): Promise<void> {
    try {
      await axiosInstance.put('/chatbot/update', request);
    } catch (error) {
      console.error('Error updating chatbot knowledge:', error);
      throw new Error('Không thể cập nhật câu trả lời');
    }
  }
}

export const chatbotService = {
  async askQuestion(question: string): Promise<string> {
    try {
      const response = await axiosInstance.post('/chatbot', question, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error asking chatbot:', error);
      throw new Error('Không thể kết nối với chatbot');
    }
  }
};