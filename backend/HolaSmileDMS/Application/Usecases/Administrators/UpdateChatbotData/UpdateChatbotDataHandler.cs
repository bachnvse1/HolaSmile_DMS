using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.IdentityModel.Tokens;

namespace Application.Usecases.Administrators.UpdateChatbotData
{
    public class UpdateChatbotDataHandler : IRequestHandler<UpdateChatbotDataCommand, bool>
    {
        private readonly IChatBotKnowledgeRepository _chatbotRepo;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public UpdateChatbotDataHandler(IChatBotKnowledgeRepository chatbotRepo, IHttpContextAccessor httpContextAccessor)
        {
            _chatbotRepo = chatbotRepo;
            _httpContextAccessor = httpContextAccessor;
        }
        public async Task<bool> Handle(UpdateChatbotDataCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (!string.Equals(currentUserRole, "patient", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
            }
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
