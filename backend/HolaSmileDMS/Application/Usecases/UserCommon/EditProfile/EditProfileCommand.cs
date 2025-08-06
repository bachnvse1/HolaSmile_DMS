using MediatR;
using Microsoft.AspNetCore.Http;

namespace HDMS_API.Application.Usecases.UserCommon.EditProfile
{
    public class EditProfileCommand : IRequest<bool>
    {
        public string? Fullname { get; set; }
        public bool? Gender { get; set; }
        public string? Address { get; set; }
        public string? DOB { get; set; }
        public IFormFile? Avatar { get; set; }
    }

}
