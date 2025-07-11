using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.UserCommon.ViewPatientPrescription
{
    public class ViewPatientPrescriptionHandler : IRequestHandler<ViewPatientPrescriptionCommand, ViewPrescriptionDTO>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IPrescriptionRepository _prescriptionRepository;
        private readonly IDentistRepository _dentistRepository;
        public ViewPatientPrescriptionHandler(IHttpContextAccessor httpContextAccessor, IPrescriptionRepository prescriptionRepository, IDentistRepository dentistRepository)
        {
            _httpContextAccessor = httpContextAccessor;
            _prescriptionRepository = prescriptionRepository;
            _dentistRepository = dentistRepository;
        }
        public async Task<ViewPrescriptionDTO> Handle(ViewPatientPrescriptionCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;

            //Check if the user is authenticated
            if (currentUserId == 0 || string.IsNullOrEmpty(currentUserRole))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53); // "Bạn cần đăng nhập để thực hiện chức năng này"
            }

            var existPrescription = await _prescriptionRepository.GetPrescriptionByPrescriptionIdAsync(request.PrescriptionId) ?? throw new Exception(MessageConstants.MSG.MSG16);

            if (string.Equals(currentUserRole, "patient", StringComparison.OrdinalIgnoreCase))
            {
                if(currentUserId!= existPrescription.Appointment?.PatientId)
                {
                    throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"
                }
            }

            var createdByDentist = await _dentistRepository.GetDentistByDentistIdAsync(existPrescription.CreateBy);

            var result = new ViewPrescriptionDTO
            {
                PrescriptionId = existPrescription.PrescriptionId,
                AppointmentId = existPrescription.AppointmentId ?? 0,
                content = existPrescription.Content,
                CreatedAt = existPrescription.CreatedAt,
                CreatedBy = createdByDentist.User?.Fullname ?? "Unknown Dentist",
            };
            return result;
        }
    }
}
