namespace Application.Usecases.Assistants.ViewListTreatmentRecord;

public class ViewListTreatmentRecordDto
{
    public int TreatmentRecordID { get; set; }

    // Appointment
    public int AppointmentID { get; set; }
    public DateTime AppointmentDate { get; set; }
    public TimeSpan AppointmentTime { get; set; }

    // Dentist
    public int DentistID { get; set; }
    public string DentistName { get; set; }

    // Procedure
    public int ProcedureID { get; set; }
    public string ProcedureName { get; set; }

    // Treatment Info
    public string? ToothPosition { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal? DiscountAmount { get; set; }
    public float? DiscountPercentage { get; set; }
    public decimal TotalAmount { get; set; }
    public int? ConsultantEmployeeID { get; set; }
    public string? TreatmentStatus { get; set; }
    public string? Symptoms { get; set; }
    public string? Diagnosis { get; set; }
    public DateTime TreatmentDate { get; set; }

    // Audit
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
}
