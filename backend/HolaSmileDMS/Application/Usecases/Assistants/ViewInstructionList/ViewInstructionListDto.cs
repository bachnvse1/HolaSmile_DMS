namespace Application.Usecases.Assistants.ViewInstructionList
{
    public class ViewInstructionListDto
    {
        public int InstructionId { get; set; }
        public string Content { get; set; }
        public string TemplateName { get; set; }
        public string TemplateContext { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CreatedByName { get; set; }
    }
}
