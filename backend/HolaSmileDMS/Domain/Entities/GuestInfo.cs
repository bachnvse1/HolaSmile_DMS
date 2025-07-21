using System.ComponentModel.DataAnnotations;

namespace Domain.Entities;

public class GuestInfo
{
    [Key]
    public Guid GuestId { get; set; }

    public string? Name { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public string? IPAddress { get; set; }
    public string? UserAgent { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime LastMessageAt { get; set; } = DateTime.Now;

    public string Status { get; set; } = "new"; // "new" | "assigned" | "closed"
}
