namespace Application.Usecases.SendNotification;

public record NotificationDto(
    int      NotificationId,
    string?  Title,
    string?  Message,
    string?  Type,
    bool     IsRead,
    DateTime CreatedAt,
    int?     RelatedObjectId,
    string?  MappingUrl);