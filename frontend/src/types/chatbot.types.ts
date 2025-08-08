export interface ChatbotKnowledge {
  id: number;
  question: string;
  answer: string;
  category: string;
}

export interface UpdateChatbotRequest {
  knowledgeId: number;
  newAnswer: string;
}

export interface ChatbotStatistics {
  total: number;
  new: number;
  updated: number;
}