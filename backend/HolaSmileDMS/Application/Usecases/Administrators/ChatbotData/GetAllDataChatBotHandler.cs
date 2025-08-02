using Application.Interfaces;
using Domain.Entities;
using MediatR;

namespace Application.Usecases.Administrators.ChatbotData
{
    public class GetAllDataChatBotHandler : IRequestHandler<GetAllDataChatBotCommand, List<ChatBotKnowledge>>
    {
        private readonly IChatBotKnowledgeRepository _chatbotRepo;
        public GetAllDataChatBotHandler(IChatBotKnowledgeRepository chatbotRepo)
        {
            _chatbotRepo = chatbotRepo;
        }
        public async Task<List<ChatBotKnowledge>> Handle(GetAllDataChatBotCommand request, CancellationToken cancellationToken)
        {
            return await _chatbotRepo.GetAllAsync();
        }
    }
}
