namespace Application.Usecases.UserCommon.ViewProfile
{
    public class ViewProfileDto
    {
        public int UserID { get; set; }
        public string Username { get; set; }
        public string? Fullname { get; set; }
        public string? Email { get; set; }
        public string? Avatar { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? DOB { get; set; }
        public bool? Gender { get; set; }
    }


}
