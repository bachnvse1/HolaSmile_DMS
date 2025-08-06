using Application.Constants;
using Application.Interfaces;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Assistants.DeactiveInstruction
{
    public class DeactiveInstructionHandler : IRequestHandler<DeactiveInstructionCommand, string>
    {
        private readonly IInstructionRepository _instructionRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMediator _mediator;
        public DeactiveInstructionHandler(
            IInstructionRepository instructionRepository,
            IHttpContextAccessor httpContextAccessor,
            IMediator mediator)
        {
            _instructionRepository = instructionRepository;
            _httpContextAccessor = httpContextAccessor;
            _mediator = mediator;
        }

        public async Task<string> Handle(DeactiveInstructionCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var role = user?.FindFirst(ClaimTypes.Role)?.Value;
            var userIdStr = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (user == null || string.IsNullOrEmpty(role) ||
                (!string.Equals(role, "assistant", StringComparison.OrdinalIgnoreCase) &&
                 !string.Equals(role, "dentist", StringComparison.OrdinalIgnoreCase)))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
            }

            if (!int.TryParse(userIdStr, out var userId))
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            var instruction = await _instructionRepository.GetByIdAsync(request.InstructionId, cancellationToken);
            if (instruction == null || instruction.IsDeleted)
                throw new KeyNotFoundException(MessageConstants.MSG.MSG115); // "Mẫu chỉ dẫn không tồn tại"

            instruction.IsDeleted = true;
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
                                "Vô hiệu hóa chỉ dẫn điều trị",
                                "Một chỉ dẫn điều trị của bạn đã bị vô hiệu hóa.",
                                "Delete",
                                instruction.InstructionID,
                                $"/patient/instructions/{instruction.AppointmentId}"
                            );

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

            return MessageConstants.MSG.MSG112; // "Hủy kích hoạt mẫu đơn thuốc thành công"
        }
    }
}