using Application.Usecases.UserCommon.ViewNotification;
using AutoMapper;

namespace Application.Common.Mappings
{
    public class MappingViewNotification : Profile
    {
        public MappingViewNotification()
        {
            CreateMap<Notification, ViewNotificationDto>();
        }
    }
}
