using MediatR;

public class ViewPatientDentalImageCommand : IRequest<List<ViewPatientDentalImageDto>>
{
    public int PatientId { get; set; }

    public int? TreatmentRecordId { get; set; }
    public int? OrthodonticTreatmentPlanId { get; set; }
}
