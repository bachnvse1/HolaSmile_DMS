import React from 'react';
import { MessageSquare, Bot, Edit3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ChatbotStatisticsProps {
  total: number;
  newCount: number;
  updatedCount: number;
}

export const ChatbotStatistics: React.FC<ChatbotStatisticsProps> = ({
  total,
  newCount,
  updatedCount
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng câu hỏi</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Câu hỏi mới</p>
              <p className="text-2xl font-bold text-green-600">{newCount}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Bot className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đã cập nhật</p>
              <p className="text-2xl font-bold text-orange-600">{updatedCount}</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Edit3 className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};