namespace Application.Common.Helpers
{
    public class GenerateOTPHelper
    {
        public static string GenerateOTP()
        {
            Random random = new Random();
            int otp = random.Next(100000, 999999);
            return otp.ToString();
        }
    }
}
