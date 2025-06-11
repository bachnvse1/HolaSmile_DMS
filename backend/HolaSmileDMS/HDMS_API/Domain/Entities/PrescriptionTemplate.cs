public class PrescriptionTemplate
{
    [Key]
    public int PreTemplateID { get; set; }

    [MaxLength(200)]
    public string? PreTemplateName { get; set; }

    public string? PreTemplateContext { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }

    public ICollection<Prescription> Prescriptions { get; set; }
}
