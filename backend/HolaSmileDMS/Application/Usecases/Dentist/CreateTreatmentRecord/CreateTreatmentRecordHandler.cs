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
            IHttpContextAccessor httpContextAccessor, IMediator mediator, IAppointmentRepository appointmentRepository, IPatientRepository patientRepository)
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
            if (user == null)
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG17); // Phiên làm việc đã hết hạn

            var currentUserId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
            var role = user.FindFirstValue(ClaimTypes.Role);
            var fullName = user?.FindFirst(ClaimTypes.GivenName)?.Value;
            if (role != "Dentist")
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // Không có quyền truy cập
            
            var appointment = await _appointmentRepository.GetAppointmentByIdAsync(request.AppointmentId);
            if (request.treatmentToday == false)
            {
                var appointmentTreatment = new Appointment
                {
                    PatientId = appointment.PatientId,
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
                {
                    throw new Exception("Tạo lịch điều trị thất bại");
                }
                if (appointment != null)
                {
                    var patient = await _patientRepository.GetPatientByPatientIdAsync(appointment.PatientId ?? 0);
                    if (patient != null)
                    {
                        int userIdNotification = patient.UserID ?? 0;
                        if (userIdNotification > 0)
                        {
                            await _mediator.Send(new SendNotificationCommand(
                                userIdNotification,
                                "Tạo lịch hẹn điều trị",
                                $"Lịch hẹn điều trị mới của bạn là ngày {request.TreatmentDate} đã được nha sĩ {fullName} tạo.",
                                "Lịch điều trị",
                                0
                            ), cancellationToken);
                        }
                    }
                }
            } else request.TreatmentDate = DateTime.Now; //nếu làm ngay hôm đó thì ngày điều trị chính là tại thời điểm đó
            
            // Validate IDs
            if (request.AppointmentId <= 0)
                throw new Exception(MessageConstants.MSG.MSG28); // Không tìm thấy lịch hẹn
            
            if (request.TreatmentDate == null || request.TreatmentDate == default)
                throw new Exception(MessageConstants.MSG.MSG83);
            
            if (request.TreatmentDate < DateTime.Today)
                throw new Exception(MessageConstants.MSG.MSG84); 
            
            if (request.DentistId <= 0)
                throw new Exception(MessageConstants.MSG.MSG42); // Vui lòng chọn bác sĩ trước khi đặt lịch

            if (request.ProcedureId <= 0)
                throw new Exception(MessageConstants.MSG.MSG16); // Không có dữ liệu phù hợp

            // Validate Quantity and UnitPrice
            if (request.Quantity <= 0)
                throw new Exception(MessageConstants.MSG.MSG88); // Số lượng không hợp lệ

            if (request.UnitPrice < 0)
                throw new Exception(MessageConstants.MSG.MSG82); // Đơn giá không hợp lệ

            var record = _mapper.Map<TreatmentRecord>(request);
            record.CreatedAt = DateTime.Now;
            record.CreatedBy = currentUserId;
            
            var subtotal = record.UnitPrice * record.Quantity;

            if (record.DiscountAmount.HasValue && record.DiscountAmount.Value > subtotal)
                throw new Exception(MessageConstants.MSG.MSG20); // Số tiền chiết khấu vượt quá tổng tiền

            if (record.DiscountPercentage.HasValue && record.DiscountPercentage.Value > 100)
                throw new Exception(MessageConstants.MSG.MSG20); // Chiết khấu vượt quá 100%

            record.TotalAmount = CalculateTotal(record);

            await _repository.AddAsync(record, cancellationToken);
            
           
            if (appointment != null)
            {
                var patient = await _patientRepository.GetPatientByPatientIdAsync(appointment.PatientId ?? 0);
                if (patient != null)
                {
                    int userIdNotification = patient.UserID ?? 0;
                    if (userIdNotification > 0)
                    {
                        var message = 
                            $"Lịch hẹn điều trị mới của bạn là ngày {request.TreatmentDate:dd/MM/yyyy} đã được nha sĩ {fullName} tạo.\n" +
                            $"Mã hồ sơ điều trị: #{record.TreatmentRecordID}";
                        await _mediator.Send(new SendNotificationCommand(
                            userIdNotification,
                            "Tạo thủ thuật điều trị",
                            message,
                            "Xem hồ sơ",
                            0
                        ), cancellationToken);
                    }
                }
            }


            return MessageConstants.MSG.MSG31; // Lưu dữ liệu thành công
        }

        private decimal CalculateTotal(TreatmentRecord record)
        {
            var subtotal = record.UnitPrice * record.Quantity;
            decimal total = subtotal;

            // Áp dụng giảm theo phần trăm
            if (record.DiscountPercentage.HasValue)
                total *= (1 - (decimal)record.DiscountPercentage.Value / 100);

            // Trừ thêm phần giảm tiền mặt
            if (record.DiscountAmount.HasValue)
                total -= record.DiscountAmount.Value;

            return total;
        }

    }
}
