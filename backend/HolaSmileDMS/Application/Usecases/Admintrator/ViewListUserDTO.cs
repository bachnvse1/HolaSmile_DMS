namespace Application.Usecases.Admintrator
{
    public class ViewListUserDTO
    {
        public string Email { get; set; }
        public string FullName { get; set; }
        public string PhoneNumber { get; set; }
        public string Role { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool? isActive { get; set; }
    }
}
