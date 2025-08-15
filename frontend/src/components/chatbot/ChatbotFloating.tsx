import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, RotateCcw } from 'lucide-react';
import { chatbotService } from '@/services/chatbotService';

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
  adjustPosition?: boolean;
}

export const ChatbotFloating: React.FC<ChatbotFloatingProps> = ({ 
  onOpenStateChange,
  forceClose = false,
  hideButton = false,
  adjustPosition = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const lineHeight = 24; 
      const maxHeight = lineHeight * 3; 
      textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputMessage]);


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
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem('chatbot-messages', JSON.stringify(messages));
    }
  }, [messages]);

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
    scrollToBottom();
  }, [messages]);

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
      {!isOpen && !hideButton && (
        <div className={`fixed z-40 ${
          adjustPosition 
            ? 'right-6 bottom-24' 
            : 'right-6 bottom-6'  
        }`}>
          <button
            onClick={handleOpen}
            className="group relative flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 rounded-full shadow-lg
              transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-sm"
            title="Chat với AI"
          >
            <Bot className="h-5 w-5" />
            <span className="hidden sm:block">Trợ lý AI</span>
          </button>
        </div>
      )}

      {isOpen && (
        <div className={`fixed z-40 w-80 sm:w-96 ${
          adjustPosition 
            ? 'right-4 bottom-24' 
            : 'right-4 bottom-6'  
        }`}>
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200">
            <div className="bg-purple-600 text-white p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5" />
                <div>
                  <h3 className="font-semibold">AI HolaSmile</h3>
                  <p className="text-xs text-purple-100">Trợ lý nha khoa</p>
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
                  <div className={`flex w-full ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 ${message.sender === 'user' ? 'ml-2' : 'mr-2'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.sender === 'user' ? 'bg-purple-600' : 'bg-gray-200'
                      }`}>
                        {message.sender === 'user' ? (
                          <User className="h-4 w-4 text-white" />
                        ) : (
                          <Bot className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                    </div>
                    <div className="max-w-[75%]">
                      <div className={`px-4 py-2 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">{message.content}</p>
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
              <div className="flex items-end space-x-2">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập câu hỏi của bạn..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none leading-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                  style={{ minHeight: '40px', maxHeight: '72px' }}
                  disabled={isLoading}
                  rows={1}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg px-4 py-2 transition-colors flex-shrink-0"
                  title="Gửi tin nhắn"
                >
                  <Send className="h-7 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Enter để gửi tin nhắn, Shift + Enter để xuống dòng
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};