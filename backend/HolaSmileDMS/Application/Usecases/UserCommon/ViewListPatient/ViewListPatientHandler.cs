using HDMS_API.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Application.Usecases.UserCommon.ViewListPatient
{
    public class ViewListPatientHandler : IRequestHandler<ViewListPatientCommand, List<ViewListPatientDto>>
    {
        private readonly IUserCommonRepository _repository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ViewListPatientHandler(IUserCommonRepository repository, IHttpContextAccessor httpContextAccessor)
        {
            _repository = repository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<List<ViewListPatientDto>> Handle(ViewListPatientCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var role = user?.FindFirst(ClaimTypes.Role)?.Value;

            if (currentUserId != request.UserId)
                throw new UnauthorizedAccessException("Bạn không có quyền truy cập danh sách bệnh nhân.");

            if (role == "Patient")
                throw new UnauthorizedAccessException("Bạn không có quyền truy cập danh sách bệnh nhân.");

            return await _repository.GetAllPatientsAsync(cancellationToken); 
        }
    }
}
