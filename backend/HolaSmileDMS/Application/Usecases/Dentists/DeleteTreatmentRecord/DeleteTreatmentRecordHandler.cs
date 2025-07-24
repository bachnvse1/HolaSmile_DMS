using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using Application.Usecases.SendNotification;

namespace Application.Usecases.Dentist.DeleteTreatmentRecord
{
    public class DeleteTreatmentRecordHandler : IRequestHandler<DeleteTreatmentRecordCommand, bool>
    {
        private readonly ITreatmentRecordRepository _repository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IPatientRepository _patientRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMediator _mediator;
        public DeleteTreatmentRecordHandler(
            ITreatmentRecordRepository repository,
            IHttpContextAccessor httpContextAccessor, IMediator mediator, IAppointmentRepository appointmentRepository, IPatientRepository patientRepository)
        {
            _repository = repository;
            _httpContextAccessor = httpContextAccessor;
            _mediator = mediator;
            _appointmentRepository = appointmentRepository;
            _patientRepository = patientRepository;
        }

        public async Task<bool> Handle(DeleteTreatmentRecordCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var role = user?.FindFirst(ClaimTypes.Role)?.Value;
            var userId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var fullName = user?.FindFirst(ClaimTypes.GivenName)?.Value;
            
            if (role != "Dentist" && role != "Assistant")
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            var record = _repository.GetTreatmentRecordByIdAsync(request.TreatmentRecordId, cancellationToken);
            if (record is null) throw new KeyNotFoundException(MessageConstants.MSG.MSG27);
            
            var appointment = await _appointmentRepository.GetAppointmentByIdAsync(record.Result.AppointmentID);
            if (appointment != null)
            {
                var patient = await _patientRepository.GetPatientByPatientIdAsync(appointment.PatientId ?? 0);
                if (patient != null)
                {
                    int userIdNotification = patient?.UserID ?? 0;
                    if (userIdNotification > 0)
                    {
                        await _mediator.Send(new SendNotificationCommand(
                                userIdNotification,
                                "Xóa hồ sơ điều trị",
                                $"Hồ sơ điều trị #{request.TreatmentRecordId} của của bạn đã được nha sĩ {fullName} xoá!!!",
                                "Xoá hồ sơ",
                                request.TreatmentRecordId),
                            cancellationToken);
                    }
                }
            }

            return await _repository.DeleteTreatmentRecordAsync(
                request.TreatmentRecordId,
                userId,
                cancellationToken);
        }
    }
}
