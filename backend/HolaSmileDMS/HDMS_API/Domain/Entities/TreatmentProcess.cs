public class TreatmentProcess
{
    [Key]
    public int TreatmentProcessID { get; set; }

    [ForeignKey("Dentist")]
    public int DentistID { get; set; }
    public Dentist Dentist { get; set; }

    [ForeignKey("TreatmentRecord")]
    public int TreatmentRecordID { get; set; }
    public TreatmentRecord TreatmentRecord { get; set; }

    [ForeignKey("Patient")]
    public int PatientID { get; set; }
    public Patient Patient { get; set; }

    [MaxLength(200)]
    public string? ProgressName { get; set; }

    [MaxLength(500)]
    public string? ProgressContent { get; set; }

    [MaxLength(255)]
    public string? Status { get; set; }

    public float? Duration { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public DateTime? EndTime { get; set; }

    [MaxLength(500)]
    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public int? CreatedBy { get; set; }
    public int? UpdatedBy { get; set; }

    public ICollection<Task> Tasks { get; set; }
}
