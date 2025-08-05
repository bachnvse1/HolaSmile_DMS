using Application.Constants;
using Application.Interfaces;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using System.Text.Json;

namespace Application.Usecases.Assistants.UpdateInstruction
{
    public class UpdateInstructionHandler : IRequestHandler<UpdateInstructionCommand, string>
    {
        private readonly IInstructionRepository _instructionRepository;
        private readonly IInstructionTemplateRepository _templateRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMediator _mediator;

        public UpdateInstructionHandler(
            IInstructionRepository instructionRepository,
            IInstructionTemplateRepository templateRepository,
            IHttpContextAccessor httpContextAccessor,
             IMediator mediator)
        {
            _instructionRepository = instructionRepository;
            _templateRepository = templateRepository;
            _httpContextAccessor = httpContextAccessor;
            _mediator = mediator;
        }

        public async Task<string> Handle(UpdateInstructionCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var role = user?.FindFirst(ClaimTypes.Role)?.Value;
            var userIdStr = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (user == null || string.IsNullOrEmpty(role) ||
                (!string.Equals(role, "assistant", System.StringComparison.OrdinalIgnoreCase) &&
                 !string.Equals(role, "dentist", System.StringComparison.OrdinalIgnoreCase)))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
            }

            if (!int.TryParse(userIdStr, out var userId))
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            // Lấy instruction cần update
            var instruction = await _instructionRepository.GetByIdAsync(request.InstructionId, cancellationToken);
            if (instruction == null || instruction.IsDeleted)
                throw new KeyNotFoundException("Không tìm thấy chỉ dẫn để cập nhật");

            // Nếu có template mới, kiểm tra template tồn tại
            if (request.Instruc_TemplateID.HasValue)
            {
                var template = await _templateRepository.GetByIdAsync(request.Instruc_TemplateID.Value, cancellationToken);
                if (template == null || template.IsDeleted)
                    throw new Exception(MessageConstants.MSG.MSG115); // "Mẫu chỉ dẫn không tồn tại"
                instruction.Instruc_TemplateID = request.Instruc_TemplateID;
            }

            // Cập nhật nội dung
            if (request.Content != null)
                instruction.Content = request.Content;

            // Cập nhật thời gian sửa
            instruction.UpdatedAt = DateTime.Now;
            instruction.UpdatedBy = userId;

            var result = await _instructionRepository.UpdateAsync(instruction, cancellationToken);
            if (!result)
                throw new Exception(MessageConstants.MSG.MSG58); // "Có lỗi xảy ra"
            
            // Gửi notification trong try/catch
            try
            {
                Console.WriteLine($"Instruction ID: {instruction.InstructionID}");
                Console.WriteLine($"Appointment: {(instruction.Appointment != null ? "exists" : "null")}");

                if (instruction.Appointment != null)
                {
                    Console.WriteLine($"Patient: {(instruction.Appointment.Patient != null ? "exists" : "null")}");

                    if (instruction.Appointment.Patient?.User != null)
                    {
                        var patientUserId = instruction.Appointment.Patient.User.UserID;
                        Console.WriteLine($"Patient User ID: {patientUserId}");

                        if (patientUserId > 0)
                        {
                            var notification = new SendNotificationCommand(
                                patientUserId,
                                "Cập nhật chỉ dẫn điều trị",
                                "Chỉ dẫn điều trị của bạn vừa được cập nhật.",
                                "Update",
                                instruction.InstructionID,
                                $"/patient/instructions/{instruction.AppointmentId}"
                            );

                            Console.WriteLine($"Sending notification: {JsonSerializer.Serialize(notification)}");
                            await _mediator.Send(notification, cancellationToken);
                            Console.WriteLine("Notification sent successfully");
                        }
                        else
                        {
                            Console.WriteLine("Patient User ID is invalid");
                        }
                    }
                    else
                    {
                        Console.WriteLine("Patient or User is null");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in notification process:");
                Console.WriteLine($"Message: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
            }

            return "Cập nhật chỉ dẫn thành công";
        }
    }
}