
namespace Application.Services
{
    public interface IEsmsService
    {
        Task<bool> SendSmsAsync(string toPhone, string message);
        Task<bool> SendPasswordAsync(string phoneNumber, string otp);
    }
}
