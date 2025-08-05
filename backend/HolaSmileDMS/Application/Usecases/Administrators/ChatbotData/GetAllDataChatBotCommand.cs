using Domain.Entities;
using MediatR;

namespace Application.Usecases.Administrators.ChatbotData
{
    public class GetAllDataChatBotCommand : IRequest<List<ChatBotKnowledge>>
    {
        public GetAllDataChatBotCommand()
        {
            // Constructor logic if needed
        }
    }
}
