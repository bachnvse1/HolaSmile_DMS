using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Prescription
{
    [Key]
    public int PrescriptionId { get; set; }

    [ForeignKey("AppointmentId")]
    public int? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }

    [ForeignKey("PrescriptionTemplate")]
    public int? Pre_TemplateID { get; set; }
    public PrescriptionTemplate? PrescriptionTemplate { get; set; }

    public string? Content { get; set; }

    public int? CreateBy { get; set; }
    public int? UpdatedBy { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }
}
