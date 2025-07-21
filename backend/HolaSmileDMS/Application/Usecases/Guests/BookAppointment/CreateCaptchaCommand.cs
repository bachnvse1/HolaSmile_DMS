using MediatR;

namespace Application.Usecases.Guests.BookAppointment
{
    public class CreateCaptchaCommand :IRequest<string>
    {
    }
}
