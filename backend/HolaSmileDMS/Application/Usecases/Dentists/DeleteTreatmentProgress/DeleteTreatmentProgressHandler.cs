using System.Security.Claims;
using MediatR;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.SendNotification;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Dentists.DeleteTreatmentProgress;

public class DeleteTreatmentProgressHandler : IRequestHandler<DeleteTreatmentProgressCommand, bool>
{
    private readonly ITreatmentProgressRepository _repository;
    private readonly IAppointmentRepository _appointmentRepository;
    private readonly IPatientRepository _patientRepository;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IMediator _mediator;
    public DeleteTreatmentProgressHandler(
        ITreatmentProgressRepository repository,
        IHttpContextAccessor httpContextAccessor, IMediator mediator, IAppointmentRepository appointmentRepository, IPatientRepository patientRepository)
    {
        _repository = repository;
        _httpContextAccessor = httpContextAccessor;
        _mediator = mediator;
        _appointmentRepository = appointmentRepository;
        _patientRepository = patientRepository;
    }


    public async Task<bool> Handle(DeleteTreatmentProgressCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var role = user?.FindFirst(ClaimTypes.Role)?.Value;
            var userId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var fullName = user?.FindFirst(ClaimTypes.GivenName)?.Value;
            
            if (role != "Dentist")
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            var progress = await _repository.GetByIdAsync(request.TreatmentProgressId, cancellationToken);
            if (progress is null) throw new KeyNotFoundException(MessageConstants.MSG.MSG27);
            
            var appointment = await _appointmentRepository.GetAppointmentByIdAsync(progress.TreatmentRecordID);
            
            var result = await _repository.DeleteAsync(request.TreatmentProgressId, cancellationToken);
            
            var patient = await _patientRepository.GetPatientByPatientIdAsync(appointment.PatientId);
            if (patient != null)
            {
                int userIdNotification = patient?.UserID ?? 0;
                if (userIdNotification > 0)
                {
                    try
                    {
                        await _mediator.Send(new SendNotificationCommand(
                                    userIdNotification,
                                    "Xóa tiến trình điều trị",
                                    $"Tiến điều trị #{request.TreatmentProgressId} của {patient.User.Fullname} đã được nha sĩ {fullName} xoá!!!",
                                    "Xoá hồ sơ",
                                    request.TreatmentProgressId, $"patient/view-treatment-progress/{progress.TreatmentRecordID}?patientId={patient.PatientID}&dentistId={appointment.DentistId}"),
                                cancellationToken);
                    } catch(Exception ex)
                    {
                            // Log the exception or handle it as needed
                    }
                        
                }
            }
            return result;
        }
}