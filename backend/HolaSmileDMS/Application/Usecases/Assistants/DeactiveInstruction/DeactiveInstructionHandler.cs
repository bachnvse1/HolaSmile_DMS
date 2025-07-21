using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Assistants.DeactiveInstruction
{
    public class DeactiveInstructionHandler : IRequestHandler<DeactiveInstructionCommand, string>
    {
        private readonly IInstructionRepository _instructionRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public DeactiveInstructionHandler(
            IInstructionRepository instructionRepository,
            IHttpContextAccessor httpContextAccessor)
        {
            _instructionRepository = instructionRepository;
            _httpContextAccessor = httpContextAccessor;
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

            return MessageConstants.MSG.MSG112; // "Hủy kích hoạt mẫu đơn thuốc thành công"
        }
    }
}