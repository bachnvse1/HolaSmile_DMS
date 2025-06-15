namespace HDMS_API.Application.Interfaces
{
    public interface IEmailService
    {
        public Task<string> GenerateOTP();
        public Task<bool> SendOtpEmailAsync(string toEmail, string otp);
        public Task<bool> SendPasswordAsync(string toEmail, string password);
    }
}
