using MediatR;

namespace Application.Usecases.Assistants.DeactivePatientDentalImage
{
    public class DeactivePatientDentalImageCommand : IRequest<string>
    {
        public int ImageId { get; set; }
    }
}
