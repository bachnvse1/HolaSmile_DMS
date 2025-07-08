namespace Application.Usecases.Dentist.CreateTreatmentProgress;

public class CreateTreatmentProgressDto
{
    public int TreatmentRecordID { get; set; }
    public int PatientID { get; set; }
    
    public int DentistID { get; set; }
    public string? ProgressName { get; set; }
    public string? ProgressContent { get; set; }
    public string? Status { get; set; }
    public float? Duration { get; set; }
    public string? Description { get; set; }
    public DateTime? EndTime { get; set; }
    public string? Note { get; set; }
}
