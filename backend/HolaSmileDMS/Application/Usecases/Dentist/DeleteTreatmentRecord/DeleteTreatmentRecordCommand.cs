using MediatR;

public class DeleteTreatmentRecordCommand : IRequest<bool>
{
    public int TreatmentRecordId { get; set; }
}
