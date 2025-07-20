namespace Application.Usecases.Administrator.ViewListUser
{
    public class ViewListUserDTO
    {
        public int UserId { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        
        public string ImageUrl { get; set; }
        public string PhoneNumber { get; set; }
        public string Role { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool? Status { get; set; }
    }
}
