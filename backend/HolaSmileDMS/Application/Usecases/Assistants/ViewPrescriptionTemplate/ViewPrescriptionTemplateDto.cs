namespace Application.Usecases.Assistant.ViewPrescriptionTemplate
{
    public class ViewPrescriptionTemplateDto
    {
        public int PreTemplateID { get; set; }
        public string? PreTemplateName { get; set; }
        public string? PreTemplateContext { get; set; }
        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}
