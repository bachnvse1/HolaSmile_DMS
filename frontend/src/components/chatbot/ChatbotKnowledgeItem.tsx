import React from 'react';
import { Edit3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ChatbotKnowledge } from '@/types/chatbot.types';

interface ChatbotKnowledgeItemProps {
  item: ChatbotKnowledge;
  onEdit: (item: ChatbotKnowledge) => void;
}

export const ChatbotKnowledgeItem: React.FC<ChatbotKnowledgeItemProps> = ({
  item,
  onEdit
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-sm font-medium text-gray-900">
                ID: {item.id}
              </span>
              <Badge
                variant={item.category === 'new' ? 'success' : 'default'}
                className="text-xs font-medium"
              >
                {item.category === 'new' ? 'Mới' : 'Đã sửa'}
              </Badge>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Câu hỏi:
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700 break-words">
                    {item.question}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Câu trả lời:
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0">
            <Button
              onClick={() => onEdit(item)}
              variant="outline"
              size="sm"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};