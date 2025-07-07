using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.UserCommon.ViewListPatient
{
    public class ViewDetailPatientHandler : IRequestHandler<ViewDetailPatientCommand, ViewDetailPatientDto>
    {
        private readonly IPatientRepository _patientRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ViewDetailPatientHandler(
            IPatientRepository patientRepository,
            IHttpContextAccessor httpContextAccessor)
        {
            _patientRepository = patientRepository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<ViewDetailPatientDto> Handle(ViewDetailPatientCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;

            if (user == null)
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG17); // Phiên làm việc đã hết hạn

            var role = user.FindFirst(ClaimTypes.Role)?.Value;

            if (role == "Patient")
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // Không có quyền truy cập

            var patient = await _patientRepository.GetPatientByPatientIdAsync(request.PatientId);

            if (patient == null)
                throw new KeyNotFoundException(MessageConstants.MSG.MSG12); // Không tìm thấy bệnh nhân

            var userInfo = patient.User;

            return new ViewDetailPatientDto
            {
                PatientId = patient.PatientID,
                Fullname = userInfo?.Fullname,
                Phone = userInfo?.Phone,
                Email = userInfo?.Email,
                Address = userInfo?.Address,
                DOB = userInfo?.DOB,
                Gender = userInfo?.Gender,
                PatientGroup = patient.PatientGroup,
                UnderlyingConditions = patient.UnderlyingConditions,
                Avatar = userInfo?.Avatar
            };
        }
    }
}
