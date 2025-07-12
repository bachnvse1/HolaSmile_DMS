using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Assistants.ViewInstructionList
{
    public class ViewInstructionListHandler : IRequestHandler<ViewInstructionListCommand, List<ViewInstructionListDto>>
    {
        private readonly IInstructionRepository _instructionRepository;
        private readonly IUserCommonRepository _userRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ViewInstructionListHandler(
            IInstructionRepository instructionRepository,
            IHttpContextAccessor httpContextAccessor,
            IUserCommonRepository userRepository)
        {
            _instructionRepository = instructionRepository;
            _httpContextAccessor = httpContextAccessor;
            _userRepository = userRepository;
        }

        public async Task<List<ViewInstructionListDto>> Handle(ViewInstructionListCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null || !user.Identity.IsAuthenticated)
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"

            var role = user.FindFirst(ClaimTypes.Role)?.Value;
            if (role != "Assistant" && role != "Dentist")
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            var instructions = await _instructionRepository.GetInstructionsByAppointmentIdAsync(request.AppointmentId);
            if (instructions == null || !instructions.Any())
                throw new KeyNotFoundException(MessageConstants.MSG.MSG16); // "Không có dữ liệu"

            var result = new List<ViewInstructionListDto>();

            foreach (var i in instructions)
            {
                var createdByUser = await _userRepository.GetByIdAsync(i.CreateBy, cancellationToken);
                result.Add(new ViewInstructionListDto
                {
                    InstructionId = i.InstructionID,
                    Content = i.Content,
                    TemplateName = i.InstructionTemplate?.Instruc_TemplateName ?? string.Empty,
                    TemplateContext = i.InstructionTemplate?.Instruc_TemplateContext ?? string.Empty,
                    CreatedAt = i.CreatedAt,
                    CreatedByName = createdByUser?.Fullname ?? "Unknown"
                });
            }

            return result;
        }
    }
}
