using MediatR;

namespace Application.Usecases.Patients.ViewTreatmentProgress;

public class ViewTreatmentProgressCommand : IRequest<List<ViewTreatmentProgressDto>>
{
    public int TreatmentRecordId { get; set; }

    public ViewTreatmentProgressCommand(int treatmentRecordId)
    {
        TreatmentRecordId = treatmentRecordId;
    }
}