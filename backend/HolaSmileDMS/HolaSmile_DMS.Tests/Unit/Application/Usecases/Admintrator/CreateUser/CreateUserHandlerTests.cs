using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Administrator.CreateUser;
using HDMS_API.Application.Common.Helpers;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

public class CreateUserHandlerTests
{
    private readonly Mock<IUserCommonRepository> _repositoryMock = new();
    private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();

    private readonly CreateUserHandler _handler;

    public CreateUserHandlerTests()
    {
        _handler = new CreateUserHandler(_repositoryMock.Object, _httpContextAccessorMock.Object);
    }

    private void SetupHttpContext(string role, int userId)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var context = new DefaultHttpContext { User = new ClaimsPrincipal(identity) };
        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);
    }

    [Fact(DisplayName = "[Unit - Abnormal] Role_Not_Admin_Throws")]
    public async System.Threading.Tasks.Task A_Role_Not_Admin_Throws()
    {
        SetupHttpContext("receptionist", 1);
        var cmd = new CreateUserCommand();

        await Assert.ThrowsAsync<Exception>(() => _handler.Handle(cmd, default));
    }

    [Fact(DisplayName = "[Unit - Abnormal] FullName_Is_Null_Throws")]
    public async System.Threading.Tasks.Task A_FullName_Null_Throws()
    {
        SetupHttpContext("administrator", 1);
        var cmd = new CreateUserCommand { FullName = null };

        await Assert.ThrowsAsync<Exception>(() => _handler.Handle(cmd, default));
    }

    [Fact(DisplayName = "[Unit - Abnormal] Invalid_Phone_Format_Throws")]
    public async System.Threading.Tasks.Task A_Invalid_Phone_Throws()
    {
        SetupHttpContext("administrator", 1);
        var cmd = new CreateUserCommand { FullName = "A", PhoneNumber = "abc" };

        await Assert.ThrowsAsync<Exception>(() => _handler.Handle(cmd, default));
    }

    [Fact(DisplayName = "[Unit - Abnormal] Duplicate_Email_Throws")]
    public async System.Threading.Tasks.Task A_Duplicate_Email_Throws()
    {
        SetupHttpContext("administrator", 1);
        var cmd = new CreateUserCommand
        {
            FullName = "A",
            PhoneNumber = "0912345678",
            Email = "test@example.com"
        };

        _repositoryMock.Setup(x => x.GetUserByPhoneAsync(cmd.PhoneNumber)).ReturnsAsync((User)null);
        _repositoryMock.Setup(x => x.GetUserByEmailAsync(cmd.Email)).ReturnsAsync(new User());

        await Assert.ThrowsAsync<Exception>(() => _handler.Handle(cmd, default));
    }

    [Fact(DisplayName = "[Unit - Abnormal] Invalid_Role_Throws")]
    public async System.Threading.Tasks.Task A_Invalid_Role_Throws()
    {
        SetupHttpContext("administrator", 1);
        var cmd = new CreateUserCommand
        {
            FullName = "Test",
            PhoneNumber = "0912345678",
            Email = "test@example.com",
            Role = "invalid"
        };

        _repositoryMock.Setup(x => x.GetUserByPhoneAsync(cmd.PhoneNumber)).ReturnsAsync((User)null);
        _repositoryMock.Setup(x => x.GetUserByEmailAsync(cmd.Email)).ReturnsAsync((User)null);

        await Assert.ThrowsAsync<Exception>(() => _handler.Handle(cmd, default));
    }

    [Fact(DisplayName = "[Unit - Normal] Create_User_Success")]
    public async System.Threading.Tasks.Task N_Create_User_Success()
    {
        SetupHttpContext("administrator", 1);
        var cmd = new CreateUserCommand
        {
            FullName = "Test",
            PhoneNumber = "0912345678",
            Email = "test@example.com",
            Gender = true,
            Role = "dentist"
        };

        _repositoryMock.Setup(x => x.GetUserByPhoneAsync(cmd.PhoneNumber)).ReturnsAsync((User)null);
        _repositoryMock.Setup(x => x.GetUserByEmailAsync(cmd.Email)).ReturnsAsync((User)null);
        _repositoryMock.Setup(x => x.CreateUserAsync(It.IsAny<User>(), cmd.Role)).ReturnsAsync(true);

        var result = await _handler.Handle(cmd, default);
        Assert.True(result);
    }
}
