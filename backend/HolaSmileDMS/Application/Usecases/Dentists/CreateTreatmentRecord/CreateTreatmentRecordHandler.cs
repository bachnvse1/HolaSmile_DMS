using Application.Constants;
using Application.Interfaces;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using Application.Usecases.SendNotification;

namespace Application.Usecases.Dentist.CreateTreatmentRecord
{
    public class CreateTreatmentRecordHandler : IRequestHandler<CreateTreatmentRecordCommand, string>
    {
        private readonly ITreatmentRecordRepository _repository;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMediator _mediator;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IPatientRepository _patientRepository;

        public CreateTreatmentRecordHandler(
            ITreatmentRecordRepository repository,
            IMapper mapper,
            IHttpContextAccessor httpContextAccessor,
            IMediator mediator,
            IAppointmentRepository appointmentRepository,
            IPatientRepository patientRepository)
        {
            _repository = repository;
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
            _mediator = mediator;
            _appointmentRepository = appointmentRepository;
            _patientRepository = patientRepository;
        }

        public async Task<string> Handle(CreateTreatmentRecordCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            ValidateUser(user);

            var currentUserId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            var role = user.FindFirstValue(ClaimTypes.Role);
            var fullName = user.FindFirst(ClaimTypes.GivenName)?.Value;

            if (role is not ("Dentist"))
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            var appointment = await _appointmentRepository.GetAppointmentByIdAsync(request.AppointmentId);
            ValidateRequest(request, appointment);

            if (request.treatmentToday == false)
            {
                await CreateAppointmentAndNotifyAsync(request, appointment, currentUserId, fullName, cancellationToken);
            }
            else
            {
                request.TreatmentDate = DateTime.Now;
            }

            var record = _mapper.Map<TreatmentRecord>(request);
            record.CreatedAt = DateTime.Now;
            record.CreatedBy = currentUserId;

            ValidateDiscounts(record);

            record.TotalAmount = CalculateTotal(record);

            await _repository.AddAsync(record, cancellationToken);

            await NotifyPatientAsync(appointment, record, fullName, cancellationToken);

            return MessageConstants.MSG.MSG31;
        }

        private void ValidateUser(ClaimsPrincipal? user)
        {
            if (user == null)
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG17);
        }

        private void ValidateRequest(CreateTreatmentRecordCommand request, Appointment? appointment)
        {
            if (request.AppointmentId <= 0)
                throw new Exception(MessageConstants.MSG.MSG28);

            if (request.TreatmentDate == null || request.TreatmentDate == default)
                throw new Exception(MessageConstants.MSG.MSG83);

            if (request.TreatmentDate < DateTime.Today || (appointment != null && request.TreatmentDate < appointment.AppointmentDate))
                throw new Exception(MessageConstants.MSG.MSG84);

            if (request.DentistId <= 0)
                throw new Exception(MessageConstants.MSG.MSG42);

            if (request.ProcedureId <= 0)
                throw new Exception(MessageConstants.MSG.MSG16);

            if (request.Quantity <= 0)
                throw new Exception(MessageConstants.MSG.MSG88);

            if (request.UnitPrice < 0)
                throw new Exception(MessageConstants.MSG.MSG82);
        }

        private void ValidateDiscounts(TreatmentRecord record)
        {
            var subtotal = record.UnitPrice * record.Quantity;

            if (record.DiscountAmount.HasValue && record.DiscountAmount.Value > subtotal)
                throw new Exception(MessageConstants.MSG.MSG20);

            if (record.DiscountPercentage.HasValue && record.DiscountPercentage.Value > 100)
                throw new Exception(MessageConstants.MSG.MSG20);
        }

        private async System.Threading.Tasks.Task CreateAppointmentAndNotifyAsync(CreateTreatmentRecordCommand request, Appointment? appointment, int currentUserId, string? fullName, CancellationToken cancellationToken)
        {
            var appointmentTreatment = new Appointment
            {
                PatientId = appointment?.PatientId,
                DentistId = request.DentistId,
                Status = "confirmed",
                Content = $"Lịch hẹn điều trị vào ngày {request.TreatmentDate}",
                IsNewPatient = false,
                AppointmentType = "treatment",
                AppointmentDate = request.TreatmentDate.Date,
                AppointmentTime = request.TreatmentDate.TimeOfDay,
                CreatedAt = DateTime.Now,
                CreatedBy = currentUserId,
                IsDeleted = false
            };

            var isBookAppointment = await _appointmentRepository.CreateAppointmentAsync(appointmentTreatment);
            if (!isBookAppointment)
                throw new Exception("Tạo lịch điều trị thất bại");

            if (appointment != null)
            {
                var patient = await _patientRepository.GetPatientByPatientIdAsync(appointment.PatientId ?? 0);
                if (patient?.UserID is int userIdNotification && userIdNotification > 0)
                {
                    try
                    {
                        await _mediator.Send(new SendNotificationCommand(
                            userIdNotification,
                            "Tạo lịch hẹn điều trị",
                            $"Lịch hẹn điều trị mới của bạn là ngày {request.TreatmentDate} đã được nha sĩ {fullName} tạo.",
                            "Lịch điều trị",
                            0
                        ), cancellationToken);
                    }
                    catch (Exception ex)
                    {
                        // Log error here if logger is available
                    }
                }
            }
        }

        private async System.Threading.Tasks.Task NotifyPatientAsync(Appointment? appointment, TreatmentRecord record, string? fullName, CancellationToken cancellationToken)
        {
            if (appointment == null) return;

            var patient = await _patientRepository.GetPatientByPatientIdAsync(appointment.PatientId ?? 0);
            if (patient?.UserID is int userIdNotification && userIdNotification > 0)
            {
                try
                {
                    var message = $"Mã hồ sơ điều trị: #{record.TreatmentRecordID} của bạn được nha sĩ {fullName} tạo và thực hiện trong hôm nay!";
                    await _mediator.Send(new SendNotificationCommand(
                        userIdNotification,
                        "Tạo thủ thuật điều trị",
                        message,
                        "Xem hồ sơ",
                        0
                    ), cancellationToken);
                }
                catch (Exception ex)
                {
                    // Log error here if logger is available
                }
            }
        }

        private decimal CalculateTotal(TreatmentRecord record)
        {
            var subtotal = record.UnitPrice * record.Quantity;
            decimal total = subtotal;

            if (record.DiscountPercentage.HasValue)
                total *= (1 - (decimal)record.DiscountPercentage.Value / 100);

            if (record.DiscountAmount.HasValue)
                total -= record.DiscountAmount.Value;

            return total;
        }
    }
}