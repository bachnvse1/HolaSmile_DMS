using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Administrators.ChatbotData
{
    public class GetAllDataChatBotHandler : IRequestHandler<GetAllDataChatBotCommand, List<ChatBotKnowledge>>
    {
        private readonly IChatBotKnowledgeRepository _chatbotRepo;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public GetAllDataChatBotHandler(IChatBotKnowledgeRepository chatbotRepo, IHttpContextAccessor httpContextAccessor)
        {
            _chatbotRepo = chatbotRepo;
            _httpContextAccessor = httpContextAccessor;
        }
        public async Task<List<ChatBotKnowledge>> Handle(GetAllDataChatBotCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (!string.Equals(currentUserRole, "owner", StringComparison.OrdinalIgnoreCase) && !string.Equals(currentUserRole, "administrator", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
            }
            return await _chatbotRepo.GetAllAsync();
        }
    }
}
