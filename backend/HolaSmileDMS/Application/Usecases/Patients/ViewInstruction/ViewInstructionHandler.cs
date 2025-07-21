using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;


namespace Application.Usecases.Patients.ViewInstruction
{
    public class ViewInstructionHandler : IRequestHandler<ViewInstructionCommand, List<ViewInstructionDto>>
    {
        private readonly IInstructionRepository _instructionRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IInstructionTemplateRepository _templateRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ViewInstructionHandler(
            IInstructionRepository instructionRepository,
            IAppointmentRepository appointmentRepository,
            IHttpContextAccessor httpContextAccessor,
            IInstructionTemplateRepository templateRepository)
        {
            _instructionRepository = instructionRepository;
            _appointmentRepository = appointmentRepository;
            _templateRepository = templateRepository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<List<ViewInstructionDto>> Handle(ViewInstructionCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var userId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var role = user?.FindFirst(ClaimTypes.Role)?.Value;

            if (!string.Equals(role, "Patient", System.StringComparison.OrdinalIgnoreCase))
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            // Lấy danh sách các appointment của bệnh nhân hiện tại
            var appointments = await _appointmentRepository.GetAppointmentsByPatientIdAsync(userId);
            var appointmentIds = appointments.Select(a => a.AppointmentId).ToList();

            // Nếu có truyền AppointmentId thì chỉ lấy chỉ dẫn của lịch hẹn đó (và phải thuộc về bệnh nhân này)
            if (request.AppointmentId.HasValue)
            {
                if (!appointmentIds.Contains(request.AppointmentId.Value))
                    throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

                appointmentIds = new List<int> { request.AppointmentId.Value };
            }

            // Lấy tất cả instruction liên quan đến các appointment này
            var instructions = await _instructionRepository.GetInstructionsByAppointmentIdsAsync(appointmentIds);

            var result = new List<ViewInstructionDto>();
            foreach (var ins in instructions.Where(i => !i.IsDeleted))
            {
                string? dentistName = null;
                // Lấy thông tin appointment để lấy DentistName
                var appointment = appointments.FirstOrDefault(a => a.AppointmentId == ins.AppointmentId);
                if (appointment != null && !string.IsNullOrEmpty(appointment.DentistName))
                {
                    dentistName = appointment.DentistName;
                }

                string? templateName = null;
                string? templateContext = null;
                int? templateId = ins.Instruc_TemplateID;
                if (templateId.HasValue)
                {
                    var template = await _templateRepository.GetByIdAsync(templateId.Value, cancellationToken);
                    if (template != null && !template.IsDeleted)
                    {
                        templateName = template.Instruc_TemplateName;
                        templateContext = template.Instruc_TemplateContext;
                    }
                }

                result.Add(new ViewInstructionDto
                {
                    InstructionId = ins.InstructionID,
                    AppointmentId = ins.AppointmentId ?? 0,
                    Content = ins.Content,
                    CreatedAt = ins.CreatedAt,
                    DentistName = dentistName,
                    Instruc_TemplateID = templateId,
                    Instruc_TemplateName = templateName,
                    Instruc_TemplateContext = templateContext
                });
            }

            return result.OrderByDescending(x => x.CreatedAt).ToList();
        }
    }
}
