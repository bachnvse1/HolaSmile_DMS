using System.Security.Claims;
using Application.Common.Mappings;
using Application.Constants;
using Application.Usecases.UserCommon.ViewSupplies;
using AutoMapper;
using HDMS_API.Infrastructure.Persistence;
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
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase("TestDb_ViewListSupplies"));

        services.AddHttpContextAccessor();
        services.AddAutoMapper(typeof(MappingSupply).Assembly);

        var provider = services.BuildServiceProvider();
        _context = provider.GetRequiredService<ApplicationDbContext>();
        _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();
        var mapper = provider.GetRequiredService<IMapper>();


        SeedData();
        _handler = new ViewListSuppliesHandler(_httpContextAccessor, new SupplyRepository(_context), mapper);
    }

    private void SeedData()
    {
        _context.Supplies.RemoveRange(_context.Supplies);
        _context.SaveChanges();

        _context.Supplies.AddRange(
            new Supplies
            {
                SupplyId = 1,
                Name = "Gloves",
                Unit = "Box",
                QuantityInStock = 10,
                Price = 100,
                ExpiryDate = DateTime.Today.AddMonths(6),
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

    [Fact(DisplayName = "ITCID03 - Abnormal: Missing authentication throws error")]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task ITCID03_Missing_Auth_Throws()
    {
        _httpContextAccessor.HttpContext = new DefaultHttpContext(); // no claims

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(new ViewListSuppliesCommand(), default));
    }

    [Fact(DisplayName = "ITCID04 - Abnormal: No supplies available throws exception")]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task ITCID04_Empty_Supply_Throws()
    {
        _context.Supplies.RemoveRange(_context.Supplies);
        _context.SaveChanges();
        SetupHttpContext("assistant", 777);

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            _handler.Handle(new ViewListSuppliesCommand(), default));

        Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
    }
}
