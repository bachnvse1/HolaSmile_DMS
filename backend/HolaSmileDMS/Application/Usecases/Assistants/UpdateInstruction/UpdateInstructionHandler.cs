using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Assistants.UpdateInstruction
{
    public class UpdateInstructionHandler : IRequestHandler<UpdateInstructionCommand, string>
    {
        private readonly IInstructionRepository _instructionRepository;
        private readonly IInstructionTemplateRepository _templateRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UpdateInstructionHandler(
            IInstructionRepository instructionRepository,
            IInstructionTemplateRepository templateRepository,
            IHttpContextAccessor httpContextAccessor)
        {
            _instructionRepository = instructionRepository;
            _templateRepository = templateRepository;
            _httpContextAccessor = httpContextAccessor;
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

            return "Cập nhật chỉ dẫn thành công";
        }
    }
}