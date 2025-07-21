using Application.Constants;
using Application.Interfaces;
using Application.Usecases.UserCommon.ChangePassword;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.UserCommon;

public class ChangePasswordHandlerTest
{
    private readonly Mock<IUserCommonRepository> _repositoryMock;
    private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
    private readonly Mock<IPasswordHasher> _passwordHasherMock;
    private readonly ChangePasswordHandler _handler;

    public ChangePasswordHandlerTest()
    {
        _repositoryMock = new Mock<IUserCommonRepository>();
        _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
        _passwordHasherMock = new Mock<IPasswordHasher>();

        _handler = new ChangePasswordHandler(
            _repositoryMock.Object,
            _httpContextAccessorMock.Object,
            _passwordHasherMock.Object
        );
    }

    private void SetupHttpContext(int userId)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        };

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        var context = new DefaultHttpContext { User = principal };

        _httpContextAccessorMock.Setup(h => h.HttpContext).Returns(context);
    }

    [Fact(DisplayName = "Normal - UTCID01 - Change password successfully")]
    public async System.Threading.Tasks.Task UTCID01_ChangePassword_Success()
    {
        // Arrange
        int userId = 1;
        SetupHttpContext(userId);

        var user = new User
        {
            UserID = userId,
            Password = "hashed_old_password"
        };

        _repositoryMock.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _passwordHasherMock.Setup(p => p.Verify(It.IsAny<string>(), It.IsAny<string>()))
            .Returns(true);

        var request = new ChangePasswordCommand
        {
            CurrentPassword = "CurrentPass123!",
            NewPassword = "NewPass123!",
            ConfirmPassword = "NewPass123!"
        };

        // Act
        var result = await _handler.Handle(request, default);

        // Assert
        Assert.Equal(MessageConstants.MSG.MSG10, result);
        _repositoryMock.Verify(r => r.EditProfileAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact(DisplayName = "Abnormal - UTCID02 - Wrong current password should throw MSG24")]
    public async System.Threading.Tasks.Task UTCID02_ChangePassword_WrongCurrentPassword_Throws()
    {
        // Arrange
        int userId = 1;
        SetupHttpContext(userId);

        var user = new User
        {
            UserID = userId,
            Password = "hashed_password"
        };

        _repositoryMock.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _passwordHasherMock.Setup(p => p.Verify(It.IsAny<string>(), It.IsAny<string>()))
            .Returns(false);

        var request = new ChangePasswordCommand
        {
            CurrentPassword = "WrongPass123!",
            NewPassword = "NewPass123!",
            ConfirmPassword = "NewPass123!"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            _handler.Handle(request, default));
        Assert.Equal(MessageConstants.MSG.MSG24, ex.Message);
    }

    [Fact(DisplayName = "Abnormal - UTCID03 - Password mismatch should throw MSG43")]
    public async System.Threading.Tasks.Task UTCID03_ChangePassword_PasswordMismatch_Throws()
    {
        // Arrange
        int userId = 1;
        SetupHttpContext(userId);

        var request = new ChangePasswordCommand
        {
            CurrentPassword = "CurrentPass123!",
            NewPassword = "NewPass123!",
            ConfirmPassword = "DifferentPass123!"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            _handler.Handle(request, default));
        Assert.Equal(MessageConstants.MSG.MSG43, ex.Message);
    }

    [Fact(DisplayName = "Abnormal - UTCID04 - Invalid password format should throw MSG02")]
    public async System.Threading.Tasks.Task UTCID04_ChangePassword_InvalidFormat_Throws()
    {
        // Arrange
        int userId = 1;
        SetupHttpContext(userId);

        var request = new ChangePasswordCommand
        {
            CurrentPassword = "CurrentPass123!",
            NewPassword = "weak",
            ConfirmPassword = "weak"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            _handler.Handle(request, default));
        Assert.Equal(MessageConstants.MSG.MSG02, ex.Message);
    }

    [Fact(DisplayName = "Abnormal - UTCID05 - Empty required fields should throw MSG07")]
    public async System.Threading.Tasks.Task UTCID05_ChangePassword_EmptyFields_Throws()
    {
        // Arrange
        int userId = 1;
        SetupHttpContext(userId);

        var request = new ChangePasswordCommand
        {
            CurrentPassword = "",
            NewPassword = "",
            ConfirmPassword = ""
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            _handler.Handle(request, default));
        Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
    }

    [Fact(DisplayName = "Abnormal - UTCID06 - User not found should throw MSG53")]
    public async System.Threading.Tasks.Task UTCID06_ChangePassword_UserNotFound_Throws()
    {
        // Arrange
        int userId = 999;
        SetupHttpContext(userId);

        _repositoryMock.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        var request = new ChangePasswordCommand
        {
            CurrentPassword = "CurrentPass123!",
            NewPassword = "NewPass123!",
            ConfirmPassword = "NewPass123!"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(request, default));
        Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
    }
}
