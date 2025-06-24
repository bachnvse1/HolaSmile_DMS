using MediatR;
namespace Application.Usecases.Dentist.CreateTreatmentProcess;
public class CreateTreatmentProgressCommand : IRequest<string>
{
    public CreateTreatmentProgressDto ProgressDto { get; set; }
}
