import React from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface ChatbotSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const ChatbotSearch: React.FC<ChatbotSearchProps> = ({
  searchTerm,
  onSearchChange
}) => {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Tìm kiếm câu hỏi hoặc câu trả lời..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
            autoComplete="off"
          />
        </div>
      </CardContent>
    </Card>
  );
};