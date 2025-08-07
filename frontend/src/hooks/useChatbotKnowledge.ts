import { useState, useEffect } from 'react';
import { ChatbotKnowledgeService } from '@/services/chatbotService';
import type { ChatbotKnowledge } from '@/types/chatbot.types';
import { toast } from 'react-toastify';

export const useChatbotKnowledge = () => {
  const [knowledge, setKnowledge] = useState<ChatbotKnowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchKnowledge = async () => {
    try {
      setLoading(true);
      const data = await ChatbotKnowledgeService.getAllKnowledge();
      setKnowledge(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };

  const updateAnswer = async (knowledgeId: number, newAnswer: string) => {
    try {
      setUpdating(true);
      await ChatbotKnowledgeService.updateAnswer({ knowledgeId, newAnswer });
      
      setKnowledge(prev =>
        prev.map(item =>
          item.id === knowledgeId
            ? { ...item, answer: newAnswer, category: 'update' }
            : item
        )
      );
      
      toast.success('Cập nhật câu trả lời thành công');
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Lỗi cập nhật');
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const filterKnowledge = (searchTerm: string) => {
    if (!searchTerm.trim()) return knowledge;
    
    return knowledge.filter(item =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getStatistics = () => {
    return {
      total: knowledge.length,
      new: knowledge.filter(item => item.category === 'new').length,
      updated: knowledge.filter(item => item.category === 'update').length
    };
  };

  useEffect(() => {
    fetchKnowledge();
  }, []);

  return {
    knowledge,
    loading,
    updating,
    fetchKnowledge,
    updateAnswer,
    filterKnowledge,
    getStatistics
  };
};