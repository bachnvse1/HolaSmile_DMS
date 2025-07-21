using System;

namespace Application.Usecases.Patients.ViewInstruction
{
    public class ViewInstructionDto
    {
        public int InstructionId { get; set; }
        public int AppointmentId { get; set; } = 0;
        public string? Content { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? DentistName { get; set; }

        // Thông tin từ InstructionTemplate
        public int? Instruc_TemplateID { get; set; }
        public string? Instruc_TemplateName { get; set; }
        public string? Instruc_TemplateContext { get; set; }
    }
}
