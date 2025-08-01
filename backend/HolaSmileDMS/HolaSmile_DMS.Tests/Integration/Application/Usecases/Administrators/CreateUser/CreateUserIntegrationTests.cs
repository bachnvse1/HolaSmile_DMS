using Application.Usecases.Administrator.CreateUser;
using HDMS_API.Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Administrators;
public class CreateUserIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly CreateUserHandler _handler;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IEmailService _emailService;

    public CreateUserIntegrationTests()
    {
        var services = new ServiceCollection();
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase("TestDb_CreateUser"));
        services.AddHttpContextAccessor();
        services.AddMemoryCache();

        var provider = services.BuildServiceProvider();
        _context = provider.GetRequiredService<ApplicationDbContext>();
        _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();
        var memoryCache = provider.GetRequiredService<IMemoryCache>();

        SeedData();
        _handler = new CreateUserHandler(
            new UserCommonRepository(_context),
            _httpContextAccessor,
            _emailService
        );
    }

    private void SeedData()
    {
        _context.Users.RemoveRange(_context.Users);
        _context.SaveChanges();

        _context.Users.Add(new User
        {
            UserID = 999,
            Username = "existinguser",
            Phone = "0911111111",
            Email = "test@exist.com",
            Password = "hashed",
            IsVerify = true,
            Status = true,
        });

        _context.SaveChanges();
    }

    private void SetupHttpContext(string role, int userId)
    {
        var context = new DefaultHttpContext();
        context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        }, "Test"));

        _httpContextAccessor.HttpContext = context;
    }

    [Fact(DisplayName = "[Integration - Normal] Admin Creates New User Successfully")]
    [Trait("TestType", "Normal")]
    public async System.Threading.Tasks.Task N_Admin_Creates_User_Successfully()
    {
        SetupHttpContext("administrator", 999);

        var result = await _handler.Handle(new CreateUserCommand
        {
            FullName = "New Employee",
            PhoneNumber = "0912345678",
            Email = "newuser@example.com",
            Gender = true,
            Role = "receptionist"
        }, default);

        Assert.True(result);
    }

    [Fact(DisplayName = "[Integration - Abnormal] Non-admin Tries to Create User")]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task A_NonAdmin_Cannot_Create_User()
    {
        SetupHttpContext("assistant", 999);

        await Assert.ThrowsAsync<Exception>(() => _handler.Handle(new CreateUserCommand
        {
            FullName = "Test",
            PhoneNumber = "0999999999",
            Email = "noadmin@example.com",
            Gender = true,
            Role = "dentist"
        }, default));
    }

    [Fact(DisplayName = "[Integration - Abnormal] Missing Required FullName")]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task A_Missing_FullName_Should_Throw()
    {
        SetupHttpContext("administrator", 999);

        await Assert.ThrowsAsync<Exception>(() => _handler.Handle(new CreateUserCommand
        {
            FullName = "",
            PhoneNumber = "0999999999",
            Email = "abc@example.com",
            Gender = true,
            Role = "assistant"
        }, default));
    }

    [Fact(DisplayName = "[Integration - Abnormal] Invalid Email Format")]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task A_Invalid_Email_Format_Should_Throw()
    {
        SetupHttpContext("administrator", 999);

        await Assert.ThrowsAsync<Exception>(() => _handler.Handle(new CreateUserCommand
        {
            FullName = "Test",
            PhoneNumber = "0999999999",
            Email = "invalidemail",
            Gender = true,
            Role = "owner"
        }, default));
    }

    [Fact(DisplayName = "[Integration - Abnormal] Duplicate Email")]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task A_Duplicate_Email_Should_Throw()
    {
        SetupHttpContext("administrator", 999);

        await Assert.ThrowsAsync<Exception>(() => _handler.Handle(new CreateUserCommand
        {
            FullName = "Duplicate Email",
            PhoneNumber = "0900000000",
            Email = "test@exist.com", // already exists
            Gender = true,
            Role = "dentist"
        }, default));
    }

    [Fact(DisplayName = "[Integration - Abnormal] Invalid Role")]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task A_Invalid_Role_Should_Throw()
    {
        SetupHttpContext("administrator", 999);

        await Assert.ThrowsAsync<Exception>(() => _handler.Handle(new CreateUserCommand
        {
            FullName = "Invalid Role",
            PhoneNumber = "0988888888",
            Email = "valid@email.com",
            Gender = true,
            Role = "invalidRole"
        }, default));
    }
}
