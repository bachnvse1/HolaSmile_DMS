using System.Security.Claims;
using Application.Usecases.Assistant.EditSupply;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants;

public class EditSupplyIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly EditSupplyHandler _handler;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public EditSupplyIntegrationTests()
    {
        var services = new ServiceCollection();
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase("EditSupplyDb"));

        services.AddHttpContextAccessor();

        var provider = services.BuildServiceProvider();
        _context = provider.GetRequiredService<ApplicationDbContext>();
        _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

        SeedData();

        _handler = new EditSupplyHandler(
            _httpContextAccessor,
            new SupplyRepository(_context)
        );
    }

    private void SeedData()
    {
        _context.Supplies.RemoveRange(_context.Supplies);
        _context.Users.RemoveRange(_context.Users);
        _context.SaveChanges();

        _context.Users.Add(new User
        {
            UserID = 1,
            Username = "assistant",
            Phone = "0900000000"
        });

        _context.Supplies.Add(new Supplies
        {
            SupplyId = 1,
            Name = "Gauze",
            Unit = "box",
            QuantityInStock = 100,
            Price = 50,
            ExpiryDate = DateTime.Today.AddMonths(6),
            CreatedAt = DateTime.Now,
            CreatedBy = 1,
            IsDeleted = false
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

    [Fact(DisplayName = "[ITCID01 - Normal] Assistant updates supply successfully")]
    [Trait("TestType", "Normal")]
    public async System.Threading.Tasks.Task ITCID01_Assistant_Updates_Supply_Successfully()
    {
        SetupHttpContext("assistant", 1);

        var command = new EditSupplyCommand
        {
            SupplyId = 1,
            SupplyName = "Gauze Updated",
            Unit = "box",
            QuantityInStock = 200,
            Price = 55,
            ExpiryDate = DateTime.Today.AddMonths(12)
        };

        var result = await _handler.Handle(command, default);

        Assert.True(result);
        var updated = _context.Supplies.Find(1);
        Assert.Equal("Gauze Updated", updated.Name);
        Assert.Equal(200, updated.QuantityInStock);
        Assert.Equal(55, updated.Price);
    }

    [Fact(DisplayName = "[ITCID02 - Abnormal] Supply not found")]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task ITCID02_Supply_Not_Found()
    {
        SetupHttpContext("assistant", 1);

        var command = new EditSupplyCommand
        {
            SupplyId = 999, // Not exist
            SupplyName = "Test",
            Unit = "box",
            QuantityInStock = 10,
            Price = 100,
            ExpiryDate = DateTime.Today.AddMonths(1)
        };

        await Assert.ThrowsAsync<ArgumentException>(() => _handler.Handle(command, default));
    }

    [Fact(DisplayName = "[ITCID03 - Abnormal] Non-assistant tries to edit supply")]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task ITCID03_Non_Assistant_Tries_To_Edit()
    {
        SetupHttpContext("receptionist", 2);

        var command = new EditSupplyCommand
        {
            SupplyId = 1,
            SupplyName = "Invalid",
            Unit = "box",
            QuantityInStock = 100,
            Price = 99,
            ExpiryDate = DateTime.Today.AddMonths(1)
        };

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
    }
}
