using System.Security.Claims;
using Application.Common.Mappings;
using Application.Interfaces;
using Application.Usecases.UserCommon.ViewSupplies;
using AutoMapper;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.UserCommon;

public class ViewListSuppliesIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly ViewListSuppliesHandler _handler;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ViewListSuppliesIntegrationTests()
    {
        var services = new ServiceCollection();

        services.AddDbContext<ApplicationDbContext>(opt =>
            opt.UseInMemoryDatabase("TestDb_ViewListSupplies"));

        services.AddHttpContextAccessor();
        services.AddAutoMapper(typeof(MappingSupply).Assembly);

        // Đăng ký repo thật dùng InMemory Db
        services.AddScoped<ISupplyRepository, SupplyRepository>();
        services.AddScoped<IUserCommonRepository, UserCommonRepository>();

        var provider = services.BuildServiceProvider();
        _context = provider.GetRequiredService<ApplicationDbContext>();
        _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();
        var mapper = provider.GetRequiredService<IMapper>();

        SeedData();

        var supplyRepo = provider.GetRequiredService<ISupplyRepository>();
        var userCommonRepo = provider.GetRequiredService<IUserCommonRepository>();

        _handler = new ViewListSuppliesHandler(
            _httpContextAccessor,
            supplyRepo,
            userCommonRepo,
            mapper
        );
    }

    private void SeedData()
    {
        // clear
        _context.Users.RemoveRange(_context.Users);
        _context.Supplies.RemoveRange(_context.Supplies);
        _context.SaveChanges();

        // users
        _context.Users.AddRange(
            new User { UserID = 1, Username = "Assistant A", Phone = "0222222222", Fullname = "Assistant A" },
            new User { UserID = 2, Username = "Dentist B", Phone = "0111111111", Fullname = "Dentist B" }
        );
        _context.SaveChanges();

        // supplies (CreatedBy phải khớp user phía trên)
        _context.Supplies.AddRange(
            new Supplies
            {
                SupplyId = 1,
                Name = "Gloves",
                Unit = "Box",
                Price = 100,
                IsDeleted = false,
                CreatedBy = 1,
                CreatedAt = DateTime.UtcNow
            },
            new Supplies
            {
                SupplyId = 2,
                Name = "Masks",
                Unit = "Box",
                Price = 50,
                IsDeleted = true,
                CreatedBy = 2,
                CreatedAt = DateTime.UtcNow
            }
        );
        _context.SaveChanges();
    }


    private void SetupHttpContext(string role, int userId)
    {
        var context = new DefaultHttpContext();
        context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        }, "TestAuth"));

        _httpContextAccessor.HttpContext = context;
    }

    [Fact(DisplayName = "ITCID01 - Normal: Assistant sees all supplies")]
    [Trait("TestType", "Normal")]
    public async System.Threading.Tasks.Task ITCID01_Assistant_Sees_All_Supplies()
    {
        SetupHttpContext("assistant", 999);

        var result = await _handler.Handle(new ViewListSuppliesCommand(), default);

        Assert.Equal(2, result.Count); // includes deleted
        Assert.Contains(result, s => s.Name == "Masks");
    }

    [Fact(DisplayName = "ITCID02 - Normal: Other roles see only non-deleted supplies")]
    [Trait("TestType", "Normal")]
    public async System.Threading.Tasks.Task ITCID02_NonAssistant_Sees_Only_NonDeleted()
    {
        SetupHttpContext("receptionist", 888);

        var result = await _handler.Handle(new ViewListSuppliesCommand(), default);

        Assert.Single(result);
        Assert.DoesNotContain(result, s => s.IsDeleted);
    }

    [Fact(DisplayName = "ITCID03 - Abnormal: No supplies available throws exception")]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task ITCID03_Empty_Supply_Throws()
    {
        _context.Supplies.RemoveRange(_context.Supplies);
        _context.SaveChanges();
        SetupHttpContext("assistant", 777);

        var result = await _handler.Handle(new ViewListSuppliesCommand(), default);
        Assert.NotNull(result);
        Assert.Empty(result);
    }
}
