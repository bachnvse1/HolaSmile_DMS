

using Domain.Entities;
using MediatR;

namespace Application.Usecases.Administrators.UpdateChatbotData
{
    public class UpdateChatbotDataCommand : IRequest<bool>
    {
        public int KnowledgeId { get; set; }
        public string NewAnswer { get; set; }
    }
}
