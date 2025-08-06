using Application.Interfaces;
using MediatR;
using Microsoft.IdentityModel.Tokens;

namespace Application.Usecases.Administrators.UpdateChatbotData
{
    public class UpdateChatbotDataHandler : IRequestHandler<UpdateChatbotDataCommand, bool>
    {
        private readonly IChatBotKnowledgeRepository _chatbotRepo;
        public UpdateChatbotDataHandler(IChatBotKnowledgeRepository chatbotRepo)
        {
            _chatbotRepo = chatbotRepo;
        }
        public async Task<bool> Handle(UpdateChatbotDataCommand request, CancellationToken cancellationToken)
        {
            var existingKnowledge = await _chatbotRepo.GetByIdAsync(request.KnowledgeId);
            if (request.NewAnswer.Trim().IsNullOrEmpty())
            {
                throw new Exception("Câu trả lời không được để trống");
            }
            existingKnowledge.Answer = request.NewAnswer;
            existingKnowledge.Category = "update";
            var isUpdated = await _chatbotRepo.UpdateResponseAsync(existingKnowledge);
            return isUpdated;
        }
    }
}
