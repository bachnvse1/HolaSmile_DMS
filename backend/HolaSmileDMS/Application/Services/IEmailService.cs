namespace HDMS_API.Application.Interfaces
{
    public interface IEmailService
    {
        public Task<bool> SendEmailAsync(string toEmail, string message, string subject);
        public Task<bool> SendPasswordAsync(string toEmail, string password);
    }
}
