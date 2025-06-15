using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Patient
{
    [Key]
    public int PatientID { get; set; }

    [ForeignKey("User")]
    public int? UserID { get; set; }
    public User? User { get; set; }

    [MaxLength(255)]
    public string? PatientGroup { get; set; }

    [MaxLength(500)]
    public string? UnderlyingConditions { get; set; }

    public int? UpdatedBy { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public ICollection<SMS> SMSs { get; set; }
    public ICollection<Image> Images { get; set; }
    public ICollection<Invoice> Invoices { get; set; }
    public ICollection<Appointment> Appointments { get; set; }
    public ICollection<OrthodonticTreatmentPlan> OrthodonticTreatmentPlans { get; set; }
    public ICollection<TreatmentProgress> TreatmentProgresses { get; set; }
}
