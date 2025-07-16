namespace Domain.Entities;

public class ChatMessage
{
    public int Id { get; set; }
    public string SenderId { get; set; }
    public string ReceiverId { get; set; } // null nếu là chat nhóm
    public string Message { get; set; }
    public DateTime Timestamp { get; set; }
    public bool IsRead { get; set; } = false;
}