using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Dentists.AssignTasksToAssistantHandler
{
    public class ViewListAssistantHandler : IRequestHandler<ViewListAssistantCommand, List<AssistantListDto>>
    {
        private readonly IAssistantRepository _assistantRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ViewListAssistantHandler(IAssistantRepository assistantRepository, IHttpContextAccessor httpContextAccessor)
        {
            _assistantRepository = assistantRepository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<List<AssistantListDto>> Handle(ViewListAssistantCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (currentUserRole == null)
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53); // "Bạn cần đăng nhập để thực hiện chức năng này"
            }

            // Kiểm tra quyền của người dùng (chỉ Dentist được sửa)
            if (!string.Equals(currentUserRole, "dentist", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
            }

            return await _assistantRepository.GetAllAssistantsAsync();
        }
    }
}
