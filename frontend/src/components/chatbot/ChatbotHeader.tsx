import React from 'react';
// import { Bot } from 'lucide-react';

export const ChatbotHeader: React.FC = () => {
  return (
    <div className="mb-8">
      <div className="flex items-center space-x-3 mb-2">
        <h1 className="text-2xl font-bold text-gray-900">
          Quản Lý Kiến Thức Chatbot
        </h1>
      </div>
      <p className="text-gray-600">
        Quản lý các câu hỏi và câu trả lời của chatbot AI
      </p>
    </div>
  );
};