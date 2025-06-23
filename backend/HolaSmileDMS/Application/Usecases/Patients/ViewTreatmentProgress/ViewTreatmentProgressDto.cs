namespace Application.Usecases.Patients.ViewTreatmentProgress;

public class ViewTreatmentProgressDto
{
    public int TreatmentProgressID { get; set; }

    // Dentist
    public int DentistID { get; set; }
    public string? DentistName { get; set; }

    // Treatment Record
    public int TreatmentRecordID { get; set; }

    // Patient
    public int PatientID { get; set; }
    public string? PatientName { get; set; }

    // Progress details
    public string? ProgressName { get; set; }
    public string? ProgressContent { get; set; }
    public string? Status { get; set; }
    public float? Duration { get; set; }
    public string? Description { get; set; }
    public DateTime? EndTime { get; set; }
    public string? Note { get; set; }

    // Audit
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}