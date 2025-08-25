import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ChatbotKnowledge } from '@/types/chatbot.types';

interface ChatbotKnowledgeItemProps {
  item: ChatbotKnowledge;
  searchTerm?: string;
  onEdit: (item: ChatbotKnowledge) => void;
  onDelete?: (item: ChatbotKnowledge) => void;
  hasDeletePermission?: boolean;
}

export const ChatbotKnowledgeItem: React.FC<ChatbotKnowledgeItemProps> = ({
  item,
  onEdit,
  onDelete,
  hasDeletePermission = false
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-medium text-gray-900">Câu hỏi</h3>
                <Badge
                  variant={item.category === 'new' ? 'success' : 'default'}
                  className="text-xs font-medium"
                >
                  {item.category === 'new' ? 'Mới' : 'Đã sửa'}
                </Badge>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p 
                  className="text-sm text-gray-700 break-all whitespace-pre-wrap"
                  style={{ 
                    wordWrap: 'break-word', 
                    overflowWrap: 'break-word',
                    wordBreak: 'break-all',
                    hyphens: 'auto'
                  }}
                >
                  {item.question}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Câu trả lời</h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p 
                  className="text-sm text-gray-700 whitespace-pre-wrap break-all"
                  style={{ 
                    wordWrap: 'break-word', 
                    overflowWrap: 'break-word',
                    wordBreak: 'break-all',
                    hyphens: 'auto'
                  }}
                >
                  {item.answer}
                </p>
              </div>
            </div>
          </div>

          {/* Buttons moved to top right */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(item)}
              className="bg-blue-600 text-white hover:bg-blue-800 border-blue-600 hover:border-blue-800 hover:text-white"
            >
              <Edit className="h-4 w-4 mr-1" />
              Chỉnh sửa
            </Button>
            
            {hasDeletePermission && onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(item)}
                className="bg-red-600 text-white hover:bg-red-800 border-red-600 hover:border-red-800 hover:text-white"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Xóa
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};