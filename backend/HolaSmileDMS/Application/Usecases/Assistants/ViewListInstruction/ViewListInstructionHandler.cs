using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Assistants.ViewListInstruction
{
    public class ViewListInstructionHandler : IRequestHandler<ViewListInstructionCommand, List<ViewListInstructionDto>>
    {
        private readonly IInstructionRepository _instructionRepository;
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ViewListInstructionHandler(
            IInstructionRepository instructionRepository,
            IUserCommonRepository userCommonRepository,
            IHttpContextAccessor httpContextAccessor)
        {
            _instructionRepository = instructionRepository;
            _userCommonRepository = userCommonRepository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<List<ViewListInstructionDto>> Handle(ViewListInstructionCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var role = user?.FindFirst(ClaimTypes.Role)?.Value;

            if (user == null || role == "Assistant" && role == "Dentist" && role == "Receptionist")
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"

            var instructions = await _instructionRepository.GetAllInstructionsAsync();

            var result = new List<ViewListInstructionDto>();
            foreach (var i in instructions)
            {
                var creator = await _userCommonRepository.GetByIdAsync(i.CreateBy, cancellationToken);
                result.Add(new ViewListInstructionDto
                {
                    InstructionId = i.InstructionID,
                    AppointmentId = i.AppointmentId ?? 0,
                    Content = i.Content,
                    CreatedAt = i.CreatedAt,
                    DentistName = creator?.Fullname,
                    Instruc_TemplateID = i.Instruc_TemplateID,
                    Instruc_TemplateName = i.InstructionTemplate?.Instruc_TemplateName,
                    Instruc_TemplateContext = i.InstructionTemplate?.Instruc_TemplateContext
                });
            }

            return result;
        }
    }
}
