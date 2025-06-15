using MediatR;

namespace HDMS_API.Application.Usecases.UserCommon.EditProfile
{
    public class EditProfileCommand : IRequest<bool>
    {
        public int UserId { get; set; } 
        public string? Fullname { get; set; }
        public bool? Gender { get; set; }
        public string? Address { get; set; }
        public string? DOB { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Avatar { get; set; }
    }
}
