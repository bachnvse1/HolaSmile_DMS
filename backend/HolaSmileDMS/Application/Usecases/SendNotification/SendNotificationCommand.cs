using MediatR;

namespace Application.Usecases.SendNotification;

public record SendNotificationCommand(
    int      UserId,
    string?  Title,
    string?  Message,
    string?  Type,
    int?     RelatedObjectId) : IRequest<Unit>;
