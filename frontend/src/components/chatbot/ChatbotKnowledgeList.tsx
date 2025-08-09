import React from 'react';
import { ChatbotKnowledgeItem } from './ChatbotKnowledgeItem';
import { Card, CardContent } from '@/components/ui/card';
import { Bot } from 'lucide-react';
import type { ChatbotKnowledge } from '@/types/chatbot.types';

interface ChatbotKnowledgeListProps {
  knowledge: ChatbotKnowledge[];
  searchTerm: string;
  onEdit: (item: ChatbotKnowledge) => void;
}

export const ChatbotKnowledgeList: React.FC<ChatbotKnowledgeListProps> = ({
  knowledge,
  searchTerm,
  onEdit
}) => {
  const filteredKnowledge = knowledge.filter(
    item =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {filteredKnowledge.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có dữ liệu'}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Thử thay đổi từ khóa tìm kiếm của bạn'
                : 'Chưa có câu hỏi và câu trả lời nào trong hệ thống'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredKnowledge.map((item) => (
            <ChatbotKnowledgeItem
              key={item.id}
              item={item}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </>
  );
};