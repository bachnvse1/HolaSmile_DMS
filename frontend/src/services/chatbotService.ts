import axiosInstance from '@/lib/axios';
import type { ChatbotKnowledge } from '@/types/chatbot.types';

export const chatbotApi = {
  getAllKnowledge: async (): Promise<ChatbotKnowledge[]> => {
    try {
      const response = await axiosInstance.get('/chatbot');
      return response.data;
    } catch (error) {
      console.error('Error fetching chatbot knowledge:', error);
      throw error;
    }
  },

  updateKnowledge: async (data: { knowledgeId: number; newAnswer: string; newQuestion: string }) => {
    try {
      const response = await axiosInstance.put('/chatbot/update', data);
      return response.data;
    } catch (error) {
      console.error('Error updating chatbot knowledge:', error);
      throw error;
    }
  },

  createKnowledge: async (data: { question: string; answer: string }) => {
    try {
      const response = await axiosInstance.post('/chatbot/create', data);
      return response.data;
    } catch (error) {
      console.error('Error creating chatbot knowledge:', error);
      throw error;
    }
  },

  deleteKnowledge: async (knowledgeId: number) => {
    try {
      const response = await axiosInstance.delete(`/chatbot/remove/${knowledgeId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting chatbot knowledge:', error);
      throw error;
    }
  }
};

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