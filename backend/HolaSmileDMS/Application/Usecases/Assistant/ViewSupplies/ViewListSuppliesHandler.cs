using Application.Constants;
using System.Security.Claims;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using AutoMapper;

namespace Application.Usecases.Assistant.ViewSupplies
{
    public class ViewListSuppliesHandler : IRequestHandler<ViewListSuppliesCommand, List<SuppliesDTO>>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ISupplyRepository _supplyRepository;
        private readonly IMapper _mapper;
        public ViewListSuppliesHandler(IHttpContextAccessor httpContextAccessor, ISupplyRepository supplyRepository, IMapper mapper)
        {
            _httpContextAccessor = httpContextAccessor;
            _supplyRepository = supplyRepository;
            _mapper = mapper;
        }
        public async Task<List<SuppliesDTO>> Handle(ViewListSuppliesCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;

            if (currentUserRole == null)
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53); // Bạn không có quyền truy cập chức năng này
            }

            var listSupplies = await _supplyRepository.GetAllSuppliesAsync();
            if (listSupplies == null || !listSupplies.Any())
            {
                return new List<SuppliesDTO>();
            }
            var suppliesDTOs = _mapper.Map<List<SuppliesDTO>>(listSupplies);

            return suppliesDTOs;
        }
    }
}
