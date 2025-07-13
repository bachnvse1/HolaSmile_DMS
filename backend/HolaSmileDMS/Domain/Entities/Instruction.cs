using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Instruction
{
    [Key]
    public int InstructionID { get; set; }

    [ForeignKey("Appointment")]
    public int? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }

    [ForeignKey("InstructionTemplate")]
    public int? Instruc_TemplateID { get; set; }
    public InstructionTemplate? InstructionTemplate { get; set; }

    public string? Content { get; set; }

    public int? CreateBy { get; set; }
    public int? UpdatedBy { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }
}
