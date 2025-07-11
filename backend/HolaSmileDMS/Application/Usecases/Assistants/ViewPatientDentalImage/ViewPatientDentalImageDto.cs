public class ViewPatientDentalImageDto
{
    public int ImageId { get; set; }
    public string? ImageURL { get; set; }
    public string? Description { get; set; }
    public int? TreatmentRecordId { get; set; }
    public int? OrthodonticTreatmentPlanId { get; set; }
    public string? ProcedureName { get; set; }            
    public string? PlanTitle { get; set; }                
    public string? TemplateName { get; set; }                
    public DateTime CreatedAt { get; set; }
}
