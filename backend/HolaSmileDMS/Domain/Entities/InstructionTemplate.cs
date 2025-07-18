using System.ComponentModel.DataAnnotations;

public class InstructionTemplate
{
    [Key]
    public int Instruc_TemplateID { get; set; }

    [MaxLength(200)]
    public string? Instruc_TemplateName { get; set; }

    public string? Instruc_TemplateContext { get; set; }

    public int? CreateBy { get; set; }
    public int? UpdatedBy { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }

    public ICollection<Instruction> Instructions { get; set; }
}
