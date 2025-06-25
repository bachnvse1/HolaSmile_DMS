using Application.Constants.Interfaces;
using Application.Usecases.UserCommon.ViewProfile;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace Tests.Unit.Application.Usecases.UserCommon;

public class ViewProfileHandlerTests
{
    private readonly Mock<IUserCommonRepository> _repositoryMock;
    private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
    private readonly ViewProfileHandler _handler;

    public ViewProfileHandlerTests()
    {
        _repositoryMock = new Mock<IUserCommonRepository>();
        _httpContextAccessorMock = new Mock<IHttpContextAccessor>();

        _handler = new ViewProfileHandler(
            _repositoryMock.Object,
            _httpContextAccessorMock.Object
        );
    }

    private void SetupHttpContext(string role, int userId)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        };

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        var context = new DefaultHttpContext { User = principal };

        _httpContextAccessorMock.Setup(h => h.HttpContext).Returns(context);
    }

    [Fact(DisplayName = "Normal - UTCID01 - Patient can view their own profile successfully")]
    public async System.Threading.Tasks.Task UTCID01_Patient_View_Own_Profile_Success()
    {
        int userId = 10;
        SetupHttpContext("patient", userId);

        var expected = new ViewProfileDto { UserID = userId, Username = "john_doe" };

        _repositoryMock.Setup(r => r.GetUserProfileAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var result = await _handler.Handle(new ViewProfileCommand(), default);

        Assert.NotNull(result);
        Assert.Equal(expected.UserID, result?.UserID);
    }

    [Fact(DisplayName = "Abnormal - UTCID02 - Patient cannot view others' profile")]
    public async System.Threading.Tasks.Task UTCID02_Patient_Cannot_View_Others_Profile()
    {
        // Login userId = 1, handler sẽ lấy từ token
        SetupHttpContext("patient", 1);

        // Fake command không cần chứa UserId nữa
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(new ViewProfileCommand(), default));

        Assert.Contains("không có quyền", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact(DisplayName = "Abnormal - UTCID03 - Null HttpContext should throw MSG53")]
    public async System.Threading.Tasks.Task UTCID03_HttpContext_Null_Should_Throw()
    {
        _httpContextAccessorMock.Setup(h => h.HttpContext).Returns((HttpContext?)null);

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(new ViewProfileCommand(), default));

        Assert.Contains("cần đăng nhập", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact(DisplayName = "Normal - UTCID04 - Profile not found should return null")]
    public async System.Threading.Tasks.Task UTCID04_Profile_Not_Found_Returns_Null()
    {
        int userId = 20;
        SetupHttpContext("patient", userId);

        _repositoryMock.Setup(r => r.GetUserProfileAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ViewProfileDto?)null);

        var result = await _handler.Handle(new ViewProfileCommand(), default);

        Assert.Null(result);
    }

    [Fact(DisplayName = "Normal - UTCID05 - Dentist can view their own profile")]
    public async System.Threading.Tasks.Task UTCID05_Dentist_View_Own_Profile_Success()
    {
        int userId = 30;
        SetupHttpContext("dentist", userId);

        var expected = new ViewProfileDto { UserID = userId, Username = "dr.dentist" };

        _repositoryMock.Setup(r => r.GetUserProfileAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var result = await _handler.Handle(new ViewProfileCommand(), default);

        Assert.NotNull(result);
        Assert.Equal(expected.UserID, result?.UserID);
    }

    [Fact(DisplayName = "Normal - UTCID06 - Receptionist can view their own profile")]
    public async System.Threading.Tasks.Task UTCID06_Receptionist_View_Own_Profile_Success()
    {
        int userId = 31;
        SetupHttpContext("receptionist", userId);

        var expected = new ViewProfileDto { UserID = userId };

        _repositoryMock.Setup(r => r.GetUserProfileAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var result = await _handler.Handle(new ViewProfileCommand(), default);

        Assert.NotNull(result);
    }

    [Fact(DisplayName = "Normal - UTCID07 - Assistant can view their own profile")]
    public async System.Threading.Tasks.Task UTCID07_Assistant_View_Own_Profile_Success()
    {
        int userId = 32;
        SetupHttpContext("assistant", userId);

        var expected = new ViewProfileDto { UserID = userId };

        _repositoryMock.Setup(r => r.GetUserProfileAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var result = await _handler.Handle(new ViewProfileCommand(), default);

        Assert.NotNull(result);
    }
}
