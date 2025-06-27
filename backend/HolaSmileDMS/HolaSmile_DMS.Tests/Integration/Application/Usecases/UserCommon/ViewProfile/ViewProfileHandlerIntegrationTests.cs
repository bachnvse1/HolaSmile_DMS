using Application.Constants;
using Application.Usecases.UserCommon.ViewProfile;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.Security.Claims;
using Xunit;
using HDMS_API.Application.Interfaces;
using HDMS_API.Infrastructure.Repositories;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.UserCommon;

public class ViewProfileHandlerIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly ViewProfileHandler _handler;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ViewProfileHandlerIntegrationTests()
    {
        var services = new ServiceCollection();

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase("ViewProfileTestDb"));

        services.AddHttpContextAccessor();
        services.AddMemoryCache();

        var provider = services.BuildServiceProvider();

        _context = provider.GetRequiredService<ApplicationDbContext>();
        _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();
        var memoryCache = provider.GetRequiredService<IMemoryCache>();

        // 👇 Mock email service
        var emailServiceMock = new Mock<IEmailService>();

        // 👇 Seed dữ liệu
        SeedData();

        // 👇 Khởi tạo handler
        _handler = new ViewProfileHandler(
            new UserCommonRepository(_context, emailServiceMock.Object, memoryCache),
            _httpContextAccessor
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
            Fullname = "Nguyen Van A",
            Email = "test@example.com",
            Phone = "0123456789",
            Gender = true,
            Avatar = "avatar.png",
            DOB = "20/06/2025",
            CreatedAt = DateTime.Now
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

    // ✅ Truy cập thành công
    [Fact(DisplayName = "Normal - UTCID01 - View profile successfully with valid token")]
    public async System.Threading.Tasks.Task UTCID01_ViewProfile_Success()
    {
        SetupHttpContext(1);
        var command = new ViewProfileCommand();

        var result = await _handler.Handle(command, default);

        Assert.NotNull(result);
        Assert.Equal("testuser", result.Username);
        Assert.Equal("Nguyen Van A", result.Fullname);
        Assert.Equal("test@example.com", result.Email);
    }

    // ❌ Không có HttpContext (chưa đăng nhập)
    [Fact(DisplayName = "Abnormal - UTCID02 - View profile without login should throw MSG53")]
    public async System.Threading.Tasks.Task UTCID02_ViewProfile_NoHttpContext_Throws()
    {
        _httpContextAccessor.HttpContext = null;
        var command = new ViewProfileCommand();

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(command, default));

        Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
    }

}
