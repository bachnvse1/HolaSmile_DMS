namespace HDMS_API.Application.Usecases.UserCommon.Login
{
    public class LoginResultDto
    {
        public bool Success { get; set; }
        public string Token { get; set; }

        public string Role { get; set; }
    }
}
