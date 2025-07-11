using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Assistants.CreateInstruction
{
    public class CreateInstructionHandler : IRequestHandler<CreateInstructionCommand, string>
    {
        private readonly IInstructionRepository _repository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CreateInstructionHandler(IInstructionRepository repository, IHttpContextAccessor httpContextAccessor)
        {
            _repository = repository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<string> Handle(CreateInstructionCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var role = user?.FindFirst(ClaimTypes.Role)?.Value;
            var userIdStr = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (user == null || role != "Assistant" || role != "Dentist")
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"

            if (!int.TryParse(userIdStr, out var userId))
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG27); // "Không xác định được người dùng"

            var instruction = new Instruction
            {
                AppointmentId = request.AppointmentId,
                Instruc_TemplateID = request.Instruc_TemplateID,
                Content = request.Content,
                CreatedAt = DateTime.UtcNow,
                CreateBy = userId,
                IsDeleted = false
            };

            var result = await _repository.CreateAsync(instruction, cancellationToken);
            if (!result)
                throw new Exception(MessageConstants.MSG.MSG58); // "Có lỗi xảy ra"

            return MessageConstants.MSG.MSG113; // "Tạo chỉ dẫn thành công"
        }
    }
}
