using Application.Constants;
using System.Security.Claims;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Dentist.CreatePrescription
{
    public class CreatePrescriptionHandler : IRequestHandler<CreatePrescriptionCommand, bool>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IPrescriptionRepository _prescriptionRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        public CreatePrescriptionHandler(IHttpContextAccessor httpContextAccessor, IPrescriptionRepository prescriptionRepository, IAppointmentRepository appointmentRepository)
        {
            _httpContextAccessor = httpContextAccessor;
            _appointmentRepository = appointmentRepository;
            _prescriptionRepository = prescriptionRepository;
        }
        public async Task<bool> Handle(CreatePrescriptionCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;

            //Check if the user is authenticated
            if (currentUserId == 0 || string.IsNullOrEmpty(currentUserRole))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53); // "Bạn cần đăng nhập để thực hiện chức năng này"
            }

            //Check if the user is not a dentist return failed message
            if (!string.Equals(currentUserRole, "dentist", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
            }

            var existApp = await _appointmentRepository.GetAppointmentByIdAsync(request.AppointmentId) ?? throw new Exception(MessageConstants.MSG.MSG28);

            var existPrescription = await _prescriptionRepository.GetPrescriptionByAppointmentIdAsync(request.AppointmentId);
            if (existPrescription != null) throw new Exception(MessageConstants.MSG.MSG108); 

            if (string.IsNullOrEmpty(request.contents.Trim())) throw new ArgumentException(MessageConstants.MSG.MSG07);  // "Vui lòng nhập thông tin bắt buộc"

            var prescription = new Prescription
            {
                AppointmentId = request.AppointmentId,
                Content = request.contents,
                CreateBy = currentUserId,
                CreatedAt = DateTime.Now,
                IsDeleted = false
            };
            var isCreated = await _prescriptionRepository.CreatePrescriptionAsync(prescription);
            return isCreated;
        }
    }
}
