using Application.Constants;
using System.Security.Claims;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using Domain.Entities;

namespace Application.Usecases.Administrators.CreateChatBotData
{
    public class CreateChatBotDataHandler : IRequestHandler<CreateChatBotDataCommand, bool>
    {
        private readonly IChatBotKnowledgeRepository _chatBotDataRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public CreateChatBotDataHandler(IChatBotKnowledgeRepository chatBotDataRepository, IHttpContextAccessor httpContextAccessor)
        {
            _chatBotDataRepository = chatBotDataRepository;
            _httpContextAccessor = httpContextAccessor;
        }
        public async Task<bool> Handle(CreateChatBotDataCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;

            if (!string.Equals(currentUserRole, "owner", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
            }

            if (string.IsNullOrWhiteSpace(request.Question) || string.IsNullOrWhiteSpace(request.Answer))
            {
                throw new ArgumentException(MessageConstants.MSG.MSG07); // "Câu hỏi và câu trả lời không được để trống"
            }

            var newKnowledge = new ChatBotKnowledge
            {
                Question = request.Question,
                Answer = request.Answer,
            };
            var isCreated = await _chatBotDataRepository.CreateNewKnownledgeAsync(newKnowledge);

            return isCreated;
        }
    }

}
