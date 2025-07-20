using MediatR;

namespace Application.Usecases.UserCommon.Otp
{
    public class RequestOTPBySmsCommand : IRequest<bool>
    {
        public string PhoneNumber { get; set; } = null!;
    }
}
