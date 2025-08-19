import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, RotateCcw, Calendar } from 'lucide-react';
import { chatbotService } from '@/services/chatbotService';
import { useNavigate } from 'react-router';

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
  const navigate = useNavigate();

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
            className="group relative flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 rounded-full shadow-2xl
              transition-all duration-500 hover:scale-110 hover:shadow-purple-500/25 hover:shadow-2xl 
              bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 
              hover:from-purple-700 hover:via-purple-800 hover:to-pink-700 
              text-white font-semibold text-sm border border-purple-400/20
              before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br 
              before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 
              before:transition-opacity before:duration-300 overflow-hidden"
            title="Chat với AI"
          >
            <Bot className="h-5 w-5 animate-pulse group-hover:animate-bounce" />
            <span className="hidden sm:block relative z-10">Trợ lý AI</span>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
          </button>
        </div>
      )}

      {isOpen && (
        <div className={`fixed z-40 w-80 sm:w-96 ${
          adjustPosition 
            ? 'right-4 bottom-24' 
            : 'right-4 bottom-6'  
        } transform transition-all duration-300 ease-out animate-slide-up`}>
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden backdrop-blur-sm bg-white/95">
            <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 text-white p-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Bot className="h-6 w-6 text-white animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">AI HolaSmile</h3>
                    <p className="text-xs text-purple-100 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      Trợ lý nha khoa trực tuyến
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={clearChatHistory}
                    className="text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200 p-2 rounded-full"
                    title="Xóa lịch sử chat"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleClose}
                    className="text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200 p-2 rounded-full"
                    title="Đóng chat"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/50 to-white scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div className={`flex w-full ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 ${message.sender === 'user' ? 'ml-3' : 'mr-3'}`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg ${
                        message.sender === 'user' 
                          ? 'bg-gradient-to-br from-purple-600 to-pink-600' 
                          : 'bg-gradient-to-br from-gray-100 to-white border-2 border-gray-200'
                      }`}>
                        {message.sender === 'user' ? (
                          <User className="h-4 w-4 text-white" />
                        ) : (
                          <Bot className="h-4 w-4 text-purple-600" />
                        )}
                      </div>
                    </div>
                    <div className="max-w-[75%]">
                      <div className={`px-4 py-3 rounded-2xl shadow-md transition-all duration-200 hover:shadow-lg ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white'
                          : 'bg-white text-gray-800 border border-gray-100'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere leading-relaxed">
                          {message.content}
                        </p>
                      </div>
                      
                      {/* Book Appointment Button - Only show for bot messages */}
                      {message.sender === 'bot' && (
                        <div className="mt-3">
                          <button
                            onClick={() => navigate('/appointment-booking')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
                          >
                            <Calendar className="h-3 w-3" />
                            Đặt lịch ngay
                          </button>
                        </div>
                      )}
                      
                      <p className={`text-xs text-gray-400 mt-2 ${
                        message.sender === 'user' ? 'text-right' : 'text-left'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="flex mr-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-white border-2 border-gray-200 flex items-center justify-center shadow-lg">
                      <Bot className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                  <div className="bg-white px-4 py-3 rounded-2xl shadow-md border border-gray-100">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-100 bg-white/80 backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập câu hỏi của bạn..."
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 
                      resize-none leading-6 overflow-y-auto bg-white/90 backdrop-blur-sm transition-all duration-200
                      placeholder:text-gray-400 text-gray-700
                      [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-purple-200 [&::-webkit-scrollbar-thumb]:rounded-full
                      hover:border-purple-300 hover:shadow-md"
                    style={{ minHeight: '44px', maxHeight: '88px' }}
                    disabled={isLoading}
                    rows={1}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 
                    disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed
                    text-white rounded-xl w-11 h-11 transition-all duration-200 flex-shrink-0 shadow-lg hover:shadow-xl 
                    hover:scale-105 active:scale-95 group flex items-center justify-center"
                  title="Gửi tin nhắn"
                >
                  <Send className="h-5 w-5 group-hover:translate-x-0.5 transition-transform duration-200" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  AI đang sẵn sàng hỗ trợ
                </p>
                <p className="text-xs text-gray-400">
                  <span className="hidden sm:inline">Enter để gửi, </span>Shift + Enter xuống dòng
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};