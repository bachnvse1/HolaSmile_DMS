using Application.Interfaces;
using Application.Usecases.Administrator.CreateUser;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using Xunit;

public class CreateUserIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly CreateUserHandler _handler;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CreateUserIntegrationTests()
    {
        var services = new ServiceCollection();

        services.AddDbContext<ApplicationDbContext>(opt => opt.UseInMemoryDatabase("TestDB"));
        services.AddHttpContextAccessor();
        services.AddScoped<IUserCommonRepository, UserCommonRepository>();
        services.AddAutoMapper(typeof(CreateUserHandler).Assembly);

        var provider = services.BuildServiceProvider();

        _context = provider.GetRequiredService<ApplicationDbContext>();
        _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

        SeedDb(_context);
        _handler = new CreateUserHandler(new UserCommonRepository(_context, null, null), _httpContextAccessor);
    }

    private void SeedDb(ApplicationDbContext context)
    {
        context.Users.RemoveRange(context.Users);
        context.SaveChanges();
    }

    private void SetupHttpContext(string role, int userId)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        };
        var context = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Test")) };
        _httpContextAccessor.HttpContext = context;
    }

    [Fact(DisplayName = "[Integration - Normal] Admin_Can_Create_User")]
    public async System.Threading.Tasks.Task N_Admin_Can_Create_User()
    {
        SetupHttpContext("administrator", 999);

        var cmd = new CreateUserCommand
        {
            FullName = "Test User",
            PhoneNumber = "0988123456",
            Email = "admin_create@test.com",
            Gender = false,
            Role = "assistant"
        };

        var result = await _handler.Handle(cmd, default);
        Assert.True(result);
    }
}
