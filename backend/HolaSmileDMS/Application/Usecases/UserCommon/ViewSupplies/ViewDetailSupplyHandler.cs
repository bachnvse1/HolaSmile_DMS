
using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.UserCommon.ViewSupplies
{
    public class ViewDetailSupplyHandler : IRequestHandler<ViewDetailSupplyCommand, SuppliesDTO>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly ISupplyRepository _supplyRepository;
        private readonly IMapper _mapper;
        public ViewDetailSupplyHandler(IHttpContextAccessor httpContextAccessor, IUserCommonRepository userCommonRepository, ISupplyRepository supplyRepository, IMapper mapper)
        {
            _httpContextAccessor = httpContextAccessor;
            _userCommonRepository = userCommonRepository;
            _supplyRepository = supplyRepository;
            _mapper = mapper;
        }

        public async Task<SuppliesDTO> Handle(ViewDetailSupplyCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            if (currentUserRole == null)
            {
                throw new UnauthorizedAccessException("Bạn không có quyền truy cập chức năng này"); // Bạn không có quyền truy cập chức năng này
            }

            var existSupply = await _supplyRepository.GetSupplyBySupplyIdAsync(request.SupplyId);

            var result = new Supplies();

            // Nếu là assistant, lấy tất cả supplies, nếu không thì chỉ lấy những supplies chưa bị xóa
            if (existSupply == null ||
            (!string.Equals(currentUserRole, "assistant", StringComparison.OrdinalIgnoreCase) && existSupply.IsDeleted))
            {
                throw new Exception(MessageConstants.MSG.MSG16); // "Không tìm thấy vật tư"
            }

            var createdByUser = await _userCommonRepository.GetByIdAsync(existSupply.CreatedBy, cancellationToken);
            var updatedByUser = await _userCommonRepository.GetByIdAsync(existSupply.UpdatedBy, cancellationToken);


            var supplyDTO = _mapper.Map<SuppliesDTO>(existSupply);
            supplyDTO.CreatedBy = createdByUser?.Fullname ?? "Unknown";
            supplyDTO.UpdateBy = updatedByUser?.Fullname ?? "Unknown";
            return supplyDTO;
        }
    }
}
