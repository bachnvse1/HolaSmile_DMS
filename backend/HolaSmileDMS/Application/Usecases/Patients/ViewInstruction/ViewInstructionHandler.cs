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

            if (!string.Equals(role, "Patient", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(role, "Assistant", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(role, "Receptionist", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(role, "Dentist", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
            }

            List<Appointment> appointments;

            if (string.Equals(role, "Patient", StringComparison.OrdinalIgnoreCase))
            {
                // Patient chỉ được xem lịch của chính mình
                appointments = await _appointmentRepository.GetAppointmentsByPatient(userId);

                // Nếu có truyền AppointmentId → phải là lịch của chính bệnh nhân
                if (request.AppointmentId.HasValue)
                {
                    var isValid = appointments.Any(a => a.AppointmentId == request.AppointmentId.Value);
                    if (!isValid)
                        throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

                    appointments = appointments
                        .Where(a => a.AppointmentId == request.AppointmentId.Value)
                        .ToList();
                }
            }
            else // Assistant, dentist , receptionist
            {
                // được xem tất cả
                appointments = request.AppointmentId.HasValue
                    ? new List<Appointment> {
                          await _appointmentRepository.GetAppointmentByIdAsync(request.AppointmentId.Value)
                      }.Where(a => a != null).ToList()
                    : await _appointmentRepository.GetAllAppointments();
            }

            var appointmentIds = appointments.Select(a => a.AppointmentId).ToList();

            // Lấy chỉ dẫn từ danh sách appointment
            var instructions = await _instructionRepository.GetInstructionsByAppointmentIdsAsync(appointmentIds);

            var result = new List<ViewInstructionDto>();

            foreach (var ins in instructions.Where(i => !i.IsDeleted))
            {
                var appointment = appointments.FirstOrDefault(a => a.AppointmentId == ins.AppointmentId);
                string? dentistName = appointment?.Dentist?.User?.Fullname;

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
