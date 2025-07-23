using System.Security.Claims;
using Application.Common.Mappings;
using Application.Constants;
using Application.Usecases.UserCommon.ViewSupplies;
using AutoMapper;
using HDMS_API.Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.UserCommon;

public class ViewDetailSupplyHandlerIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly ViewDetailSupplyHandler _handler;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ViewDetailSupplyHandlerIntegrationTests()
    {
        var services = new ServiceCollection();
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase("TestDb_ViewDetailSupply"));

        services.AddMemoryCache();
        services.AddHttpContextAccessor();
        services.AddAutoMapper(typeof(MappingSupply).Assembly);

        var provider = services.BuildServiceProvider();
        _context = provider.GetRequiredService<ApplicationDbContext>();
        _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();
        var mapper = provider.GetRequiredService<IMapper>();
        var memoryCache = provider.GetRequiredService<IMemoryCache>();

        SeedData();
        _handler = new ViewDetailSupplyHandler(_httpContextAccessor, new UserCommonRepository(_context, new Mock<IEmailService>().Object), new SupplyRepository(_context), mapper);
    }

    private void SeedData()
    {
        _context.Users.RemoveRange(_context.Users);
        _context.Supplies.RemoveRange(_context.Supplies);
        _context.SaveChanges();

        _context.Users.AddRange(
            new User { UserID = 1, Username = "Assistant A", Phone ="0222222222"},
            new User { UserID = 2, Username = "Dentist B", Phone = "01111111111" }
        );

        _context.Supplies.AddRange(
            new Supplies
            {
                SupplyId = 1,
                Name = "Gloves",
                Unit = "Box",
                QuantityInStock = 10,
                Price = 100,
                ExpiryDate = DateTime.Today.AddMonths(6),
                CreatedBy = 1,
                UpdatedBy = 1,
                IsDeleted = false
            },
            new Supplies
            {
                SupplyId = 2,
                Name = "Masks",
                Unit = "Box",
                QuantityInStock = 20,
                Price = 50,
                ExpiryDate = DateTime.Today.AddMonths(6),
                CreatedBy = 1,
                UpdatedBy = 1,
                IsDeleted = true
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

    [Fact(DisplayName = "ITCID01 - Normal: Assistant views non-deleted supply")]
    [Trait("TestType", "Normal")]
    public async System.Threading.Tasks.Task ITCID01_Assistant_View_NotDeleted_Supply()
    {
        SetupHttpContext("assistant", 1);

        var result = await _handler.Handle(new ViewDetailSupplyCommand { SupplyId = 1 }, default);

        Assert.NotNull(result);
        Assert.Equal("Gloves", result.Name);
    }

    [Fact(DisplayName = "ITCID02 - Normal: Assistant views deleted supply")]
    [Trait("TestType", "Normal")]
    public async System.Threading.Tasks.Task ITCID02_Assistant_View_Deleted_Supply()
    {
        SetupHttpContext("assistant", 1);

        var result = await _handler.Handle(new ViewDetailSupplyCommand { SupplyId = 2 }, default);

        Assert.NotNull(result);
        Assert.Equal("Masks", result.Name);
    }

    [Fact(DisplayName = "ITCID03 - Abnormal: Missing authentication throws error")]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task ITCID03_Missing_Auth_Throws()
    {
        _httpContextAccessor.HttpContext = new DefaultHttpContext(); // no claims

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(new ViewDetailSupplyCommand { SupplyId = 1 }, default));
    }

    [Fact(DisplayName = "ITCID04 - Normal: Dentist views non-deleted supply")]
    [Trait("TestType", "Normal")]
    public async System.Threading.Tasks.Task ITCID04_Dentist_View_NotDeleted_Supply()
    {
        SetupHttpContext("dentist", 2);

        var result = await _handler.Handle(new ViewDetailSupplyCommand { SupplyId = 1 }, default);

        Assert.NotNull(result);
        Assert.Equal("Gloves", result.Name);
    }

    [Fact(DisplayName = "ITCID05 - Abnormal: Dentist views deleted supply throws error")]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task ITCID05_Dentist_View_Deleted_Supply_Throws()
    {
        SetupHttpContext("dentist", 2);

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            _handler.Handle(new ViewDetailSupplyCommand { SupplyId = 2 }, default));

        Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
    }

    [Fact(DisplayName = "ITCID06 - Abnormal: Supply does not exist throws error")]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task ITCID06_Supply_NotFound_Throws()
    {
        SetupHttpContext("assistant", 1);

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            _handler.Handle(new ViewDetailSupplyCommand { SupplyId = 999 }, default));

        Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
    }
}
