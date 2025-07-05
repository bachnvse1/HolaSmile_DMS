
using Application.Constants;
using System.Security.Claims;
using Application.Interfaces;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.UserCommon.ViewListProcedure
{
    public class ViewDetailProcedureHandler : IRequestHandler<ViewDetailProcedureCommand,ViewProcedureDto>
    {
        private readonly IProcedureRepository _procedureRepository;
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMapper _mapper;

        public ViewDetailProcedureHandler(IProcedureRepository procedureRepository, IUserCommonRepository userCommonRepository, IHttpContextAccessor httpContextAccessor, IMapper mapper)
        {
            _procedureRepository = procedureRepository;
            _userCommonRepository = userCommonRepository;
            _httpContextAccessor = httpContextAccessor;
            _mapper = mapper;
        }

        public async Task<ViewProcedureDto> Handle(ViewDetailProcedureCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;

            var currentUserRole = user.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (currentUserRole == null)
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53); // "Bạn cần đăng nhập..."
            }

            var existProcedure = await _procedureRepository.GetProcedureByProcedureId(request.proceduredId);
            if (existProcedure == null ||
            (!string.Equals(currentUserRole, "assistant", StringComparison.OrdinalIgnoreCase) && existProcedure.IsDeleted))
            {
                throw new Exception(MessageConstants.MSG.MSG16); // Không tìm thấy thủ thuật
            }

            var createdByUser = await _userCommonRepository.GetByIdAsync(existProcedure.CreatedBy, cancellationToken);
            var updatedByUser = await _userCommonRepository.GetByIdAsync(existProcedure.UpdatedBy, cancellationToken);

            var result = _mapper.Map<ViewProcedureDto>(existProcedure);
            result.CreatedBy = createdByUser?.Fullname ?? "Unknown";
            result.UpdateBy = updatedByUser?.Fullname ?? "Unknown";

            return result;
        }
    }
}
