using Application.Constants;
using Application.Interfaces;
using HDMS_API.Application.Usecases.UserCommon.Login;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.UserCommon;

public sealed class LoginHandlerTests
{
    private readonly Mock<IUserCommonRepository> _repoMock;
    private readonly Mock<IPasswordHasher> _passwordHasherMock;
    private readonly Mock<IJwtService> _jwtServiceMock;
    private readonly LoginHandler _handler;

    public LoginHandlerTests()
    {
        _repoMock = new Mock<IUserCommonRepository>();
        _passwordHasherMock = new Mock<IPasswordHasher>();
        _jwtServiceMock = new Mock<IJwtService>();

        _handler = new LoginHandler(
            _repoMock.Object,
            _passwordHasherMock.Object,
            _jwtServiceMock.Object
        );
    }

    [Fact]
    public async System.Threading.Tasks.Task Login_WithValidCredentials_ReturnsSuccess()
    {
        var username = "testuser";
        var password = "password";

        _repoMock.Setup(x => x.GetByUsernameAsync(username, It.IsAny<CancellationToken>()))
                 .ReturnsAsync(new User
                 {
                     UserID = 1,
                     Username = username,
                     Password = "hashed-pw",
                     Status = true
                 });

        _passwordHasherMock.Setup(x => x.Verify(password, "hashed-pw")).Returns(true);
        _repoMock.Setup(x => x.GetUserRoleAsync(username, It.IsAny<CancellationToken>()))
                 .ReturnsAsync("Patient");
        _jwtServiceMock.Setup(x => x.GenerateJWTToken(It.IsAny<User>(), "Patient"))
                       .Returns("fake-jwt-token");
        _jwtServiceMock.Setup(x => x.GenerateRefreshToken("1")).Returns("fake-refresh-token");
        var command = new LoginCommand { Username = "testuser", Password = "password" };
        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.Success);
        Assert.Equal("fake-jwt-token", result.Token);
        Assert.Equal("fake-refresh-token", result.refreshToken);
        Assert.Equal("Patient", result.Role);
    }

    [Fact]
    public async System.Threading.Tasks.Task Login_WithInvalidUsername_ThrowsMSG01()
    {
        _repoMock.Setup(x => x.GetByUsernameAsync("invaliduser", It.IsAny<CancellationToken>()))
                 .ReturnsAsync((User?)null);
        var command = new LoginCommand { Username = "invaliduser", Password = "any" };
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(command, CancellationToken.None));

        Assert.Equal(MessageConstants.MSG.MSG01, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task Login_WithWrongPassword_ThrowsMSG01()
    {
        _repoMock.Setup(x => x.GetByUsernameAsync("testuser", It.IsAny<CancellationToken>()))
                 .ReturnsAsync(new User
                 {
                     UserID = 1,
                     Username = "testuser",
                     Password = "hashed-pw",
                     Status = true
                 });

        _passwordHasherMock.Setup(x => x.Verify("wrongpw", "hashed-pw")).Returns(false);
        var command = new LoginCommand { Username = "testuser", Password = "wrongpw" };
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(command, CancellationToken.None));

        Assert.Equal(MessageConstants.MSG.MSG01, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task Login_WithInactiveAccount_ThrowsMSG72()
    {
        _repoMock.Setup(x => x.GetByUsernameAsync("lockeduser", It.IsAny<CancellationToken>()))
                 .ReturnsAsync(new User
                 {
                     UserID = 1,
                     Username = "lockeduser",
                     Password = "pw",
                     Status = false
                 });
        var command = new LoginCommand { Username = "lockeduser", Password = "pw" };
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(command, CancellationToken.None));

        Assert.Equal(MessageConstants.MSG.MSG72, ex.Message);
    }
}