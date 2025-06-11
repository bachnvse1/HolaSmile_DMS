public class PrescriptionTemplate
{
    [Key]
    public int Pre_TemplateID { get; set; }

    [MaxLength(200)]
    public string? Pre_TemplateName { get; set; }

    public string? Pre_TemplateContext { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }

    public ICollection<Prescription> Prescriptions { get; set; }
}
