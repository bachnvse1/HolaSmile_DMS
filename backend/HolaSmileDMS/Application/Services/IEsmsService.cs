
namespace Application.Services
{
    public interface IEsmsService
    {
        Task<bool> SendSmsAsync(string toPhone, string message);
        Task<bool> SendOTPAsync(string phoneNumber, string otp);
    }
}
