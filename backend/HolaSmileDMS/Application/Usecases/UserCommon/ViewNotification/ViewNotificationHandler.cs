using Application.Constants;
using Application.Interfaces;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.UserCommon.ViewNotification
{
    public class ViewNotificationHandler : IRequestHandler<ViewNotificationCommand, List<ViewNotificationDto>>
    {
        private readonly INotificationsRepository _repository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMapper _mapper;

        public ViewNotificationHandler(
            INotificationsRepository repository,
            IHttpContextAccessor httpContextAccessor,
            IMapper mapper)
        {
            _repository = repository;
            _httpContextAccessor = httpContextAccessor;
            _mapper = mapper;
        }

        public async Task<List<ViewNotificationDto>> Handle(ViewNotificationCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var userIdClaim = user?.FindFirst(ClaimTypes.NameIdentifier);

            if (userIdClaim == null)
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            var userId = int.Parse(userIdClaim.Value);

            var entities = await _repository.GetAllNotificationsForUserAsync(userId, cancellationToken);
            return _mapper.Map<List<ViewNotificationDto>>(entities);
        }
    }
}
