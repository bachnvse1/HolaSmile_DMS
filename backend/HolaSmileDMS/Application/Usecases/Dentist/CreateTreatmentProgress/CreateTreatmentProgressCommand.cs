using MediatR;
namespace Application.Usecases.Dentist.CreateTreatmentProgress;
public class CreateTreatmentProgressCommand : IRequest<string>
{
    public CreateTreatmentProgressDto ProgressDto { get; set; }
}
