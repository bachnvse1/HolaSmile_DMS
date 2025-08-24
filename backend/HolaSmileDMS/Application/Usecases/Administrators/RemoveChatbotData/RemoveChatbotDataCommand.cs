
using MediatR;

namespace Application.Usecases.Administrators.RemoveChatbotData
{
    public class RemoveChatbotDataCommand : IRequest<bool>
    {
        public int KnowledgeId { get; set; }
        public RemoveChatbotDataCommand(int knowledgeId)
        {
            KnowledgeId = knowledgeId;
        }
    }
}
