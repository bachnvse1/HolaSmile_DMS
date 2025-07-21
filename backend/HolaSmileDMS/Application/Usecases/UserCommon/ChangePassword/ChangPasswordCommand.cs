using MediatR;

namespace Application.Usecases.UserCommon.ChangePassword;

public class ChangePasswordCommand : IRequest<string>
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}