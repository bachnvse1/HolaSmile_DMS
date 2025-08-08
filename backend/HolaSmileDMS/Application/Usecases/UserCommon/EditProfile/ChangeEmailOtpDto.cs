namespace HDMS_API.Application.Usecases.UserCommon.ChangeEmailOtp
{
    public class ChangeEmailOtpDto
    {
        public int UserId { get; set; }
        public string NewEmail { get; set; } = string.Empty;
        public string Otp { get; set; } = string.Empty;
        public DateTime ExpiryTime { get; set; }
        public DateTime SendTime { get; set; }
        public int RetryCount { get; set; } = 0;
    }
}
