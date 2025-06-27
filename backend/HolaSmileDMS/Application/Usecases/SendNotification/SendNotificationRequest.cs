namespace Application.Usecases.SendNotification;

public class SendNotificationRequest
{
    public string? Title { get; set; }
    public string? Message { get; set; }
    public string? Type { get; set; }
    public int? RelatedObjectId { get; set; }
}
