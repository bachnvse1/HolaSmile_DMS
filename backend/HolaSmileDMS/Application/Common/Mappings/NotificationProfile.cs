using Application.Usecases.SendNotification;
using AutoMapper;

namespace Application.Common.Mappings;

public class NotificationProfile : Profile
{
    public NotificationProfile()
    {
        CreateMap<Notification, NotificationDto>();
    }
}