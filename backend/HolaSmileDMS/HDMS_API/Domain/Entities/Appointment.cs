using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Appointment
{
    [Key]
    public int AppointmentId { get; set; }

    // Foreign Keys
    [ForeignKey("Patient")]
    public int? PatientId { get; set; }
    public Patient? Patient { get; set; }

    [ForeignKey("Dentist")]
    public int DentistId { get; set; }
    public Dentist Dentist { get; set; }

    // Appointment Details
    [MaxLength(50)]
    public string? Status { get; set; }

    public string? Content { get; set; }

    public bool IsNewPatient { get; set; }

    [MaxLength(255)]
    public string? AppointmentType { get; set; }

    [Column(TypeName = "date")]
    public DateTime AppointmentDate { get; set; }

    [Column(TypeName = "time")]
    public TimeSpan AppointmentTime { get; set; }

    // Audit Fields
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public int? CreatedBy { get; set; }
    public int? UpdatedBy { get; set; }

    public bool IsDeleted { get; set; }
}
