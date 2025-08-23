
using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Administrators.RemoveChatbotData
{
    public class RemoveChatbotDataHandler : IRequestHandler<RemoveChatbotDataCommand, bool>
    {
        private readonly IChatBotKnowledgeRepository _chatbotRepo;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public RemoveChatbotDataHandler(IChatBotKnowledgeRepository chatbotRepo, IHttpContextAccessor httpContextAccessor)
        {
            _chatbotRepo = chatbotRepo;
            _httpContextAccessor = httpContextAccessor;
        }
        public async Task<bool> Handle(RemoveChatbotDataCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            if (!string.Equals(currentUserRole, "owner", StringComparison.OrdinalIgnoreCase) && !string.Equals(currentUserRole, "administrator", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
            }
            var existingKnowledge = await _chatbotRepo.GetByIdAsync(request.KnowledgeId);
            if (existingKnowledge == null)
            {
                throw new Exception(MessageConstants.MSG.MSG16); 
            }
            var isRemoved = await _chatbotRepo.RemoveKnowledgeAsync(existingKnowledge);
            return isRemoved;
        }
    }
}
