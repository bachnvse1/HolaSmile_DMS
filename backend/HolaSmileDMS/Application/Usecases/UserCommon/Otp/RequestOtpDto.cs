namespace HDMS_API.Application.Usecases.UserCommon.Otp
{
    public class RequestOtpDto
    {
        public string Email { get; set; }
        public string Otp { get; set; }
        public DateTime ExpiryTime { get; set; }
        public DateTime SendTime { get; set; }
        public int RetryCount { get; set; } = 0; 
    }
}
