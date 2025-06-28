using MediatR;

namespace Application.Usecases.UserCommon.ViewNotification
{
    public class ViewNotificationCommand : IRequest<List<ViewNotificationDto>>
    {
    }
}