using Application.Usecases.UserCommon.ViewProfile;
using HDMS_API.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

public class ViewProfileHandler : IRequestHandler<ViewProfileCommand, ViewProfileDto?>
{
    private readonly IUserCommonRepository _repository;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ViewProfileHandler(IUserCommonRepository repository, IHttpContextAccessor httpContextAccessor)
    {
        _repository = repository;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<ViewProfileDto?> Handle(ViewProfileCommand request, CancellationToken cancellationToken)
    {
        var user = _httpContextAccessor.HttpContext?.User;

        var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

        var isAuthen = currentUserId == request.UserId;

        if (!isAuthen)
            throw new UnauthorizedAccessException("Bạn không có quyền xem hồ sơ người dùng này.");

        return await _repository.GetUserProfileAsync(request.UserId, cancellationToken);
    }
}
