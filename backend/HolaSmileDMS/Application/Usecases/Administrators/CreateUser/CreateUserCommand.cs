using MediatR;

namespace Application.Usecases.Administrator.CreateUser
{
    public class CreateUserCommand : IRequest<bool>
    {
        public string FullName { get; set; }
        public bool Gender { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string Role { get; set; }
    }
}
