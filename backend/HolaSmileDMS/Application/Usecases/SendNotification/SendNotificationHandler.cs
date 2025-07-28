using Application.Interfaces;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace Application.Usecases.SendNotification;

public class SendNotificationHandler : IRequestHandler<SendNotificationCommand, Unit>
{
    private readonly IServiceScopeFactory _scopeFactory;

    public SendNotificationHandler(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    public async Task<Unit> Handle(SendNotificationCommand c, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();

        var userRepo = scope.ServiceProvider.GetRequiredService<IUserCommonRepository>();
        var notificationRepo = scope.ServiceProvider.GetRequiredService<INotificationsRepository>();

        var userExists = await userRepo.GetByIdAsync(c.UserId, ct);
        if (userExists == null)
            throw new KeyNotFoundException($"UserId {c.UserId} không tồn tại.");

        var entity = new Notification
        {
            UserId          = c.UserId,
            Title           = c.Title,
            Message         = c.Message,
            Type            = c.Type,
            IsRead          = false,
            CreatedAt       = DateTime.Now,
            RelatedObjectId = c.RelatedObjectId,
            MappingUrl      = c.MappingUrl // Uncomment if you want to use MappingUrl
        };

        await notificationRepo.SendNotificationAsync(entity, ct);
        return Unit.Value;
    }
}