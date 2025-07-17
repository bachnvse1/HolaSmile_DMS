using Application.Constants;
using System.Security.Claims;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using AutoMapper;

namespace Application.Usecases.UserCommon.ViewSupplies
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

            var listSupplies = new List<Supplies>();

            var allProcedures = await _supplyRepository.GetAllSuppliesAsync();

            if (string.Equals(currentUserRole, "assistant", StringComparison.OrdinalIgnoreCase))
            {
                listSupplies = allProcedures;
            }
            else
            {
                listSupplies = allProcedures.Where(s => !s.IsDeleted).ToList();
            }

            if (listSupplies == null || !listSupplies.Any())
            {
                listSupplies = new List<Supplies>();
            }

            return _mapper.Map<List<SuppliesDTO>>(listSupplies) ?? new List<SuppliesDTO>();
        }
    }
}
