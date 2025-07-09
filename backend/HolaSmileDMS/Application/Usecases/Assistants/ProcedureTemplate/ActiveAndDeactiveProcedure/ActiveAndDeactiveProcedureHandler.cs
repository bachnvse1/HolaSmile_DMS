using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Assistant.ProcedureTemplate.ActiveAndDeactiveProcedure
{
    public class ActiveAndDeactiveProcedureHandler : IRequestHandler<ActiveAndDeactiveProcedureCommand, bool>
    {
        private readonly IProcedureRepository _procedureRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public ActiveAndDeactiveProcedureHandler(IProcedureRepository procedureRepository, IHttpContextAccessor httpContextAccessor)
        {
            _procedureRepository = procedureRepository;
            _httpContextAccessor = httpContextAccessor;
        }
        public async Task<bool> Handle(ActiveAndDeactiveProcedureCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;

            var currentUserRole = user.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (currentUserRole == null)
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53); // "Bạn cần đăng nhập..."
            }

            if (!string.Equals(currentUserRole, "assistant", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
            }

            var procedure = await _procedureRepository.GetProcedureByProcedureId(request.ProcedureId);
            if(procedure == null)
            {
                throw new Exception(MessageConstants.MSG.MSG16); // "Không tìm thấy thủ thuật"
            }
            procedure.IsDeleted = !procedure.IsDeleted;
            procedure.UpdatedBy = currentUserId;
            procedure.UpdatedAt = DateTime.Now;

            var isUpdated = await _procedureRepository.UpdateProcedureAsync(procedure);
            return isUpdated;
        }
    }
}
