
using System.Security.Claims;
using Application.Interfaces;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.UserCommon.ViewSupplies
{
    public class ViewDetailSupplyHandler : IRequestHandler<ViewDetailSupplyCommand, SuppliesDTO>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ISupplyRepository _supplyRepository;
        private readonly IMapper _mapper;
        public ViewDetailSupplyHandler(IHttpContextAccessor httpContextAccessor, ISupplyRepository supplyRepository, IMapper mapper)
        {
            _httpContextAccessor = httpContextAccessor;
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
            var supply = await _supplyRepository.GetSupplyBySupplyIdAsync(request.SupplyId);
            if (supply == null)
            {
                return null; // Hoặc ném ra ngoại lệ nếu cần
            }
            var supplyDTO = _mapper.Map<SuppliesDTO>(supply);
            return supplyDTO;
        }
    }
}
