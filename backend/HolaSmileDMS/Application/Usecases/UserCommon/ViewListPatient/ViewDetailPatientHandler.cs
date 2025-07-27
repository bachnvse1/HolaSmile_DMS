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
            var currentUserId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var patient = await _patientRepository.GetPatientByPatientIdAsync(request.PatientId)
                         ?? throw new KeyNotFoundException(MessageConstants.MSG.MSG12); // Không tìm thấy bệnh nhân

            // Kiểm tra quyền:
            if (role == "Patient")
            {
                // Chỉ cho xem nếu PatientID thuộc về chính mình
                if (patient.UserID != currentUserId)
                    throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
            }

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
