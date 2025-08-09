import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, RotateCcw } from 'lucide-react';
import { chatbotService } from '@/services/chatbotService';
import { useAuth } from '@/hooks/useAuth';
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatbotFloatingProps {
  onOpenStateChange?: (isOpen: boolean) => void;
  forceClose?: boolean;
  hideButton?: boolean; 
}

export const ChatbotFloating: React.FC<ChatbotFloatingProps> = ({ 
  onOpenStateChange,
  forceClose = false,
  hideButton = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isAuthenticated } = useAuth();
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      setIsOpen(false);
      onOpenStateChange?.(false);
    }
  }, [isAuthenticated, isOpen, onOpenStateChange]);

  useEffect(() => {
    if (forceClose && isOpen) {
      setIsOpen(false);
      onOpenStateChange?.(false);
    }
  }, [forceClose, isOpen, onOpenStateChange]);

  const handleOpen = () => {
    setIsOpen(true);
    onOpenStateChange?.(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    onOpenStateChange?.(false);
  };

  useEffect(() => {
    if (isAuthenticated) return; 
    
    const savedMessages = sessionStorage.getItem('chatbot-messages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages).map((msg: Message) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(parsedMessages);
      } catch (error) {
        console.error('Error loading chat history:', error);
        setDefaultMessage();
      }
    } else {
      setDefaultMessage();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) return;
    
    if (messages.length > 0) {
      sessionStorage.setItem('chatbot-messages', JSON.stringify(messages));
    }
  }, [messages, isAuthenticated]);

  const setDefaultMessage = () => {
    const welcomeMessage: Message = {
      id: '1',
      content: 'Xin chào! Tôi là trợ lý AI của Nha Khoa HolaSmile. Tôi có thể giúp gì cho bạn?',
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  const clearChatHistory = () => {
    sessionStorage.removeItem('chatbot-messages');
    setDefaultMessage();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAuthenticated) return;
    scrollToBottom();
  }, [messages, isAuthenticated]);

  if (isAuthenticated) {
    return null;
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await chatbotService.askQuestion(inputMessage);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ trực tiếp với chúng tôi.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      {!isOpen && !hideButton && !isAuthenticated && (
        <div className="fixed right-6 bottom-24 z-50">
          <button
            onClick={handleOpen}
            className="group relative flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 rounded-full shadow-lg
              transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-sm"
            title="Chat với AI"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="hidden sm:block">Trò chuyện với trợ lý ảo</span>
          </button>
        </div>
      )}

      {isOpen && (
        <div className="fixed right-4 bottom-24 z-[60] w-80 sm:w-96">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200">
            <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5" />
                <div>
                  <h3 className="font-semibold">AI HolaSmile</h3>
                  <p className="text-xs text-blue-100">Trợ lý nha khoa</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={clearChatHistory}
                  className="text-white hover:text-gray-200 transition-colors p-1"
                  title="Xóa lịch sử chat"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={handleClose}
                  className="text-white hover:text-gray-200 transition-colors"
                  title="Đóng chat"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="h-80 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-xs lg:max-w-md ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 ${message.sender === 'user' ? 'ml-2' : 'mr-2'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.sender === 'user' ? 'bg-blue-600' : 'bg-gray-200'
                      }`}>
                        {message.sender === 'user' ? (
                          <User className="h-4 w-4 text-white" />
                        ) : (
                          <Bot className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                    </div>
                    <div>
                      <div className={`px-4 py-2 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      <p className={`text-xs text-gray-500 mt-1 ${
                        message.sender === 'user' ? 'text-right' : 'text-left'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex mr-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                  <div className="bg-gray-100 px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập câu hỏi của bạn..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg px-4 py-2 transition-colors"
                  title="Gửi tin nhắn"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Nhấn Enter để gửi tin nhắn
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};