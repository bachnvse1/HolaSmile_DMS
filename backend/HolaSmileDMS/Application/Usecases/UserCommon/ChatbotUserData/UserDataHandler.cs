//using System.Security.Claims;
//using Application.Interfaces;
//using MediatR;
//using Microsoft.AspNetCore.Http;

//namespace Application.Usecases.UserCommon.ChatbotUserData
//{
//    public class UserDataHandler : IRequestHandler<UserDataCommand, bool>
//    {

//        private readonly IHttpContextAccessor _httpContextAccessor;
//        private readonly IChatBotKnowledgeRepository _chatBotKnowledgeRepository;
//        public UserDataHandler(IHttpContextAccessor httpContextAccessor, IChatBotKnowledgeRepository chatBotKnowledgeRepository) 
//        {
//            _httpContextAccessor = httpContextAccessor;
//            _chatBotKnowledgeRepository = chatBotKnowledgeRepository;
//        }
//        public async Task<bool> Handle(UserDataCommand request, CancellationToken cancellationToken)
//        {
//            var user = _httpContextAccessor.HttpContext?.User;
//            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
//            var data = await _chatBotKnowledgeRepository.GetDentistData(currentUserId, cancellationToken);
//            return data;
//        }
//    }
//}
