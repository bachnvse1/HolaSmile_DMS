using Application.Constants;
using Application.Interfaces;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Assistants.CreateInstruction
{
    public class CreateInstructionHandler : IRequestHandler<CreateInstructionCommand, string>
    {
        private readonly IInstructionRepository _repository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IInstructionTemplateRepository _templateRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IMediator _mediator;

        public CreateInstructionHandler(
            IInstructionRepository repository,
            IHttpContextAccessor httpContextAccessor,
            IInstructionTemplateRepository templateRepository,
            IAppointmentRepository appointmentRepository,
            IMediator mediator)
        {
            _repository = repository;
            _httpContextAccessor = httpContextAccessor;
            _templateRepository = templateRepository;
            _appointmentRepository = appointmentRepository;
            _mediator = mediator;
        }

        public async Task<string> Handle(CreateInstructionCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var role = user?.FindFirst(ClaimTypes.Role)?.Value;
            var userIdStr = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (user == null || string.IsNullOrEmpty(role) ||
                (role.ToLower() != "assistant" && role.ToLower() != "dentist"))
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"

            if (!int.TryParse(userIdStr, out var userId))
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG27); // "Không xác định được người dùng"

            // ✅ Kiểm tra Appointment có tồn tại không
            var appointment = await _appointmentRepository.GetAppointmentByIdAsync(request.AppointmentId);
            if (appointment == null || appointment.IsDeleted)
                throw new Exception(MessageConstants.MSG.MSG28); // "Cuộc hẹn không tồn tại"

            // ✅ Kiểm tra đã có instruction cho appointment này chưa
            var exists = await _repository.ExistsByAppointmentIdAsync(request.AppointmentId, cancellationToken);
            if (exists)
                throw new Exception("Chỉ dẫn cho lịch hẹn này đã tồn tại, không thể tạo mới.");

            // ✅ Kiểm tra template nếu được chỉ định
            if (request.Instruc_TemplateID.HasValue)
            {
                var template = await _templateRepository.GetByIdAsync(request.Instruc_TemplateID.Value, cancellationToken);
                if (template == null || template.IsDeleted)
                    throw new Exception(MessageConstants.MSG.MSG115); // "Mẫu chỉ dẫn không tồn tại"
            }

            var instruction = new Instruction
            {
                AppointmentId = request.AppointmentId,
                Instruc_TemplateID = request.Instruc_TemplateID,
                Content = request.Content,
                CreatedAt = DateTime.Now,
                CreateBy = userId,
                IsDeleted = false
            };

            var result = await _repository.CreateAsync(instruction, cancellationToken);
            if (!result)
                throw new Exception(MessageConstants.MSG.MSG58); // "Có lỗi xảy ra"
            if (appointment.PatientId.HasValue)
            {
                try
                {
                    await _mediator.Send(new SendNotificationCommand(
                        appointment.PatientId.Value, // userId của bệnh nhân
                        "Chỉ dẫn điều trị mới",
                        "Bạn vừa nhận được chỉ dẫn điều trị mới từ phòng khám.",
                        "Chỉ dẫn điều trị",
                        null // Có thể truyền thêm thông tin nếu cần
                    ), cancellationToken);
                }
                catch (Exception ex)
                {
                    // Có thể log lỗi nếu cần
                }
            }
            return MessageConstants.MSG.MSG114; // "Tạo chỉ dẫn thành công"
        }
    }
}
