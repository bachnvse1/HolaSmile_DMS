namespace Application.Usecases.Guests.ViewAllGuestCommand;

public class GuestChatDto
{
    public Guid GuestId { get; set; }
    public string Name { get; set; }
    public string PhoneNumber { get; set; }
    public string Email { get; set; }
    public DateTime LastMessageAt { get; set; }
    public string Status { get; set; } // new | assigned | closed
}
