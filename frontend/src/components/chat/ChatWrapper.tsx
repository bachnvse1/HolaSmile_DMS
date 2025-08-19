import React, { useState } from 'react';
import ConsultantChatBox from '@/components/chat/ConsultantChatBox';
import { ChatbotFloating } from '@/components/chatbot/ChatbotFloating';
import { useAuth } from '@/hooks/useAuth';

export const ChatWrapper: React.FC = () => {
  const [isConsultantChatOpen, setIsConsultantChatOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleConsultantChatChange = (isOpen: boolean) => {
    setIsConsultantChatOpen(isOpen);
    if (isOpen && isChatbotOpen) {
      setIsChatbotOpen(false);
    }
  };

  const handleChatbotChange = (isOpen: boolean) => {
    setIsChatbotOpen(isOpen);
    if (isOpen && isConsultantChatOpen) {
      setIsConsultantChatOpen(false);
    }
  };

  return (
    <>
      {!isAuthenticated && (
        <ConsultantChatBox 
          onOpenStateChange={handleConsultantChatChange}
          forceClose={!isConsultantChatOpen && isChatbotOpen}
        />
      )}
      
      <ChatbotFloating 
        onOpenStateChange={handleChatbotChange}
        forceClose={!isChatbotOpen && isConsultantChatOpen && !isAuthenticated}
        hideButton={isConsultantChatOpen && !isAuthenticated}
        adjustPosition={isConsultantChatOpen && !isAuthenticated}
      />
    </>
  );
};