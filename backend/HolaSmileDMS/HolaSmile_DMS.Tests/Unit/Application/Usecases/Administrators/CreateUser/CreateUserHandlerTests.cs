using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Administrator.CreateUser;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Administrators;
public class CreateUserHandlerTests
{
    private readonly Mock<IUserCommonRepository> _userCommonRepoMock = new();
    private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
    private readonly CreateUserHandler _handler;

    public CreateUserHandlerTests()
    {
        _handler = new CreateUserHandler(_userCommonRepoMock.Object, _httpContextAccessorMock.Object);
    }

    private void SetupHttpContext(string role, int userId)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Role, role)
        };

        var identity = new ClaimsIdentity(claims);
        var principal = new ClaimsPrincipal(identity);
        var context = new DefaultHttpContext { User = principal };

        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);
    }

    // ✅ UTCID01 - Normal - Tạo user mới thành công
    [Fact(DisplayName = "UTCID01 - Normal - Tạo user mới thành công")]
    public async System.Threading.Tasks.Task UTCID01_CreateUser_Success()
    {
        SetupHttpContext("administrator", 1);

        var command = new CreateUserCommand
        {
            FullName = "Nguyen Van A",
            Email = "test@example.com",
            PhoneNumber = "0987654321",
            Gender = true,
            Role = "receptionist"
        };

        _userCommonRepoMock.Setup(r => r.GetUserByPhoneAsync(command.PhoneNumber)).ReturnsAsync((User)null);
        _userCommonRepoMock.Setup(r => r.GetUserByEmailAsync(command.Email)).ReturnsAsync((User)null);
        _userCommonRepoMock.Setup(r => r.CreateUserAsync(It.IsAny<User>(), "receptionist")).ReturnsAsync(true);
        _userCommonRepoMock.Setup(r => r.SendPasswordForGuestAsync(command.Email)).ReturnsAsync(true);

        var result = await _handler.Handle(command, default);

        Assert.True(result);
    }

    // ❌ UTCID02 - Abnormal - Không phải administrator
    [Fact(DisplayName = "UTCID02 - Abnormal - Không phải administrator")]
    public async System.Threading.Tasks.Task UTCID02_UnauthorizedRole_ShouldThrow()
    {
        SetupHttpContext("receptionist", 1);

        var command = new CreateUserCommand { FullName = "Test", PhoneNumber = "0987", Email = "test@example.com", Role = "receptionist" };

        var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }

    // ❌ UTCID03 - Abnormal - FullName null
    [Fact(DisplayName = "UTCID03 - Abnormal - Fullname rỗng")]
    public async System.Threading.Tasks.Task UTCID03_EmptyFullname_ShouldThrow()
    {
        SetupHttpContext("administrator", 1);

        var command = new CreateUserCommand { FullName = "", PhoneNumber = "0987", Email = "test@example.com", Role = "assistant" };

        var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
    }

    // ❌ UTCID04 - Abnormal - Số điện thoại sai định dạng
    [Fact(DisplayName = "UTCID04 - Abnormal - SĐT sai định dạng")]
    public async System.Threading.Tasks.Task UTCID04_InvalidPhone_ShouldThrow()
    {
        SetupHttpContext("administrator", 1);

        var command = new CreateUserCommand { FullName = "A", PhoneNumber = "abc", Email = "test@example.com", Role = "owner" };

        var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG56, ex.Message);
    }

    // ❌ UTCID05 - Abnormal - Số điện thoại đã tồn tại
    [Fact(DisplayName = "UTCID05 - Abnormal - SĐT đã tồn tại")]
    public async System.Threading.Tasks.Task UTCID05_ExistingPhone_ShouldThrow()
    {
        SetupHttpContext("administrator", 1);

        var command = new CreateUserCommand { FullName = "A", PhoneNumber = "0987654321", Email = "test@example.com", Role = "dentist" };

        _userCommonRepoMock.Setup(r => r.GetUserByPhoneAsync(command.PhoneNumber)).ReturnsAsync(new User());

        var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG23, ex.Message);
    }

    // ❌ UTCID06 - Abnormal - Email sai định dạng
    [Fact(DisplayName = "UTCID06 - Abnormal - Email sai định dạng")]
    public async System.Threading.Tasks.Task UTCID06_InvalidEmail_ShouldThrow()
    {
        SetupHttpContext("administrator", 1);

        var command = new CreateUserCommand { FullName = "A", PhoneNumber = "0987654321", Email = "invalidemail", Role = "assistant" };

        _userCommonRepoMock.Setup(r => r.GetUserByPhoneAsync(command.PhoneNumber)).ReturnsAsync((User)null);

        var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG08, ex.Message);
    }

    // ❌ UTCID07 - Abnormal - Email đã tồn tại
    [Fact(DisplayName = "UTCID07 - Abnormal - Email đã tồn tại")]
    public async System.Threading.Tasks.Task UTCID07_ExistingEmail_ShouldThrow()
    {
        SetupHttpContext("administrator", 1);

        var command = new CreateUserCommand { FullName = "A", PhoneNumber = "0987654321", Email = "test@example.com", Role = "owner" };

        _userCommonRepoMock.Setup(r => r.GetUserByPhoneAsync(command.PhoneNumber)).ReturnsAsync((User)null);
        _userCommonRepoMock.Setup(r => r.GetUserByEmailAsync(command.Email)).ReturnsAsync(new User());

        var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG22, ex.Message);
    }

    // ❌ UTCID08 - Abnormal - Role không hợp lệ
    [Fact(DisplayName = "UTCID08 - Abnormal - Role không hợp lệ")]
    public async System.Threading.Tasks.Task UTCID08_InvalidRole_ShouldThrow()
    {
        SetupHttpContext("administrator", 1);

        var command = new CreateUserCommand { FullName = "A", PhoneNumber = "0987654321", Email = "test@example.com", Role = "admin" };

        _userCommonRepoMock.Setup(r => r.GetUserByPhoneAsync(command.PhoneNumber)).ReturnsAsync((User)null);
        _userCommonRepoMock.Setup(r => r.GetUserByEmailAsync(command.Email)).ReturnsAsync((User)null);

        var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        Assert.Equal("Vai trò nhân viên không hợp lệ", ex.Message);
    }

}
