import axiosInstance from "@/lib/axios";

export const chatbotService = {
  async askQuestion(question: string): Promise<string> {
    try {
      const response = await axiosInstance.post('/chatbot', question, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = response.data; 
      return data || 'Xin lỗi, tôi không thể trả lời câu hỏi này. Vui lòng liên hệ trực tiếp với chúng tôi để được hỗ trợ tốt nhất.';
    } catch (error) {
      console.error('Chatbot service error:', error);
      throw new Error('Không thể kết nối với dịch vụ chatbot');
    }
  }
};