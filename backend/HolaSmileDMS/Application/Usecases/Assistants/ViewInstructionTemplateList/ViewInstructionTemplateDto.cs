namespace Application.Usecases.Assistants.ViewInstructionTemplateList;

public class ViewInstructionTemplateDto
{
    public int Instruc_TemplateID { get; set; }
    public string Instruc_TemplateName { get; set; }
    public string Instruc_TemplateContext { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string CreateByName { get; set; }
    public string UpdateByName { get; set; }
    
}