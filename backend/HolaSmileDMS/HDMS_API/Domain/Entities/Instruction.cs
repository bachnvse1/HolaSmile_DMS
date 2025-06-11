public class Instruction
{
    [Key]
    public int InstructionID { get; set; }

    [ForeignKey("TreatmentRecord")]
    public int? TreatmentRecord_Id { get; set; }
    public TreatmentRecord? TreatmentRecord { get; set; }

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
