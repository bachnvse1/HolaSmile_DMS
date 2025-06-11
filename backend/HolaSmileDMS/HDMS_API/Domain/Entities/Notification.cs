public class Notification
{
    [Key]
    public int NotificationId { get; set; }

    [ForeignKey("User")]
    public int UserId { get; set; }
    public User User { get; set; }

    [MaxLength(255)]
    public string? Title { get; set; }

    public string? Message { get; set; }

    [MaxLength(50)]
    public string? Type { get; set; }

    public bool IsRead { get; set; }

    public DateTime CreatedAt { get; set; }

    public int? RelatedObjectId { get; set; }
}
