using Application.Constants;
using Application.Interfaces;
using Application.Usecases.UserCommon.ViewProfile;
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
        if (user == null)
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53);

        var currentUserId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

        return await _repository.GetUserProfileAsync(currentUserId, cancellationToken);
    }
}
