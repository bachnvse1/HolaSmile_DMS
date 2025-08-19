using Application.Constants;
using Application.Interfaces;
using Application.Usecases.UserCommon.ChangePassword;
using HDMS_API.Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Infrastructure.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.UserCommon;

public class ChangePasswordIntegrationTest
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ChangePasswordHandler _handler;
    private readonly IPasswordHasher _passwordHasher;

    public ChangePasswordIntegrationTest()
    {
        var services = new ServiceCollection();

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase("ChangePasswordTestDb"));

        services.AddMemoryCache();
        services.AddHttpContextAccessor();

        var provider = services.BuildServiceProvider();

        _context = provider.GetRequiredService<ApplicationDbContext>();
        _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();
        var memoryCache = provider.GetRequiredService<IMemoryCache>();
        _passwordHasher = new PasswordHasher();

        SeedData();

        _handler = new ChangePasswordHandler(
            new UserCommonRepository(_context),
            _httpContextAccessor,
            _passwordHasher
        );
    }

    private void SeedData()
    {
        _context.Users.RemoveRange(_context.Users);
        _context.SaveChanges();

        _context.Users.Add(new User
        {
            UserID = 1,
            Username = "testuser",
            Password = BCrypt.Net.BCrypt.HashPassword("CurrentPass123!"),
            Email = "test@example.com",
            Phone = "0123456789",
            CreatedAt = DateTime.UtcNow,
            IsVerify = true
        });

        _context.SaveChanges();
    }

    private void SetupHttpContext(int userId)
    {
        var context = new DefaultHttpContext();
        context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        }, "TestAuth"));

        _httpContextAccessor.HttpContext = context;
    }

    [Fact(DisplayName = "Normal - UTCID01 - Change password successfully")]
    [Trait("TestType", "Integration")]
    public async System.Threading.Tasks.Task UTCID01_ChangePassword_Success()
    {
        // Arrange
        SetupHttpContext(1);
        var command = new ChangePasswordCommand
        {
            CurrentPassword = "CurrentPass123!",
            NewPassword = "NewPass123!",
            ConfirmPassword = "NewPass123!"
        };

        // Act
        var result = await _handler.Handle(command, default);

        // Assert
        Assert.Equal(MessageConstants.MSG.MSG10, result);

        // Verify mật khẩu mới
        var updatedUser = await _context.Users.FindAsync(1);
        Assert.True(_passwordHasher.Verify("NewPass123!", updatedUser.Password));
    }

    [Fact(DisplayName = "Abnormal - UTCID02 - Change password with wrong current password should throw MSG24")]
    [Trait("TestType", "Integration")]
    public async System.Threading.Tasks.Task UTCID02_ChangePassword_WrongCurrentPassword_Throws()
    {
        // Arrange
        SetupHttpContext(1);
        var command = new ChangePasswordCommand
        {
            CurrentPassword = "WrongPass123!",
            NewPassword = "NewPass123!",
            ConfirmPassword = "NewPass123!"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG24, ex.Message);
    }

    [Fact(DisplayName = "Abnormal - UTCID03 - Change password with password mismatch should throw MSG43")]
    [Trait("TestType", "Integration")]
    public async System.Threading.Tasks.Task UTCID03_ChangePassword_PasswordMismatch_Throws()
    {
        // Arrange
        SetupHttpContext(1);
        var command = new ChangePasswordCommand
        {
            CurrentPassword = "CurrentPass123!",
            NewPassword = "NewPass123!",
            ConfirmPassword = "DifferentPass123!"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG43, ex.Message);
    }

    [Fact(DisplayName = "Abnormal - UTCID04 - Change password with invalid format should throw MSG02")]
    [Trait("TestType", "Integration")]
    public async System.Threading.Tasks.Task UTCID04_ChangePassword_InvalidFormat_Throws()
    {
        // Arrange
        SetupHttpContext(1);
        var command = new ChangePasswordCommand
        {
            CurrentPassword = "CurrentPass123!",
            NewPassword = "weak",
            ConfirmPassword = "weak"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG02, ex.Message);
    }

    [Fact(DisplayName = "Abnormal - UTCID05 - Change password with non-existent user should throw MSG53")]
    [Trait("TestType", "Integration")]
    public async System.Threading.Tasks.Task UTCID05_ChangePassword_UserNotFound_Throws()
    {
        // Arrange
        SetupHttpContext(999); // User không tồn tại
        var command = new ChangePasswordCommand
        {
            CurrentPassword = "CurrentPass123!",
            NewPassword = "NewPass123!",
            ConfirmPassword = "NewPass123!"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
    }

    [Fact(DisplayName = "Abnormal - UTCID06 - Change password with empty fields should throw MSG07")]
    [Trait("TestType", "Integration")]
    public async System.Threading.Tasks.Task UTCID06_ChangePassword_EmptyFields_Throws()
    {
        // Arrange
        SetupHttpContext(1);
        var command = new ChangePasswordCommand
        {
            CurrentPassword = "",
            NewPassword = "",
            ConfirmPassword = ""
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
    }
}