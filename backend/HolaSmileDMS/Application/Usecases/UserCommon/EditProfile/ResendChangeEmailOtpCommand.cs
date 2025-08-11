using MediatR;

public class ResendChangeEmailOtpCommand : IRequest<bool>
{
    public string NewEmail { get; set; } = string.Empty;
}