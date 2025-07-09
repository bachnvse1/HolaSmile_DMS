using MediatR;
using Microsoft.AspNetCore.Http;

public class CreatePatientDentalImageCommand : IRequest<string>
{
    public int PatientId { get; set; }
    public IFormFile ImageFile { get; set; }
    public string Description { get; set; }
    public int? TreatmentRecordId { get; set; }
    public int? OrthodonticTreatmentPlanId { get; set; }
}
