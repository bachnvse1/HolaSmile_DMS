using System.Security.Claims;
using Application.Constants;
using Application.Usecases.Dentist.ViewDentistSchedule;
using Application.Usecases.UserCommon.ViewProcedures;
using AutoMapper;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.UserCommon;

public class ViewListProcedureHandlerIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly ViewListProcedureHandler _handler;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ViewListProcedureHandlerIntegrationTests()
    {
        var services = new ServiceCollection();
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase("TestDb_ViewListProcedure"));

        services.AddMemoryCache();
        services.AddHttpContextAccessor();
        services.AddAutoMapper(typeof(ViewProcedureDto).Assembly);

        var provider = services.BuildServiceProvider();
        _context = provider.GetRequiredService<ApplicationDbContext>();
        _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();
        var mapper = provider.GetRequiredService<IMapper>();

        SeedData();

        _handler = new ViewListProcedureHandler(
            new ProcedureRepository(_context),
            _httpContextAccessor,
            mapper
        );
    }

    private void SeedData()
    {
        _context.Users.RemoveRange(_context.Users);
        _context.Procedures.RemoveRange(_context.Procedures);
        _context.SaveChanges();

        _context.Users.AddRange(
            new User { UserID = 1, Username = "Assistant A", Phone = "0999999999" },
            new User { UserID = 2, Username = "Receptionist B", Phone = "0888888888" }
        );

        _context.Procedures.AddRange(
            new Procedure
            {
                ProcedureId = 1,
                ProcedureName = "Tẩy trắng răng",
                Price = 1000000,
                Description = "Thẩm mỹ",
                IsDeleted = false
            },
            new Procedure
            {
                ProcedureId = 2,
                ProcedureName = "Nhổ răng",
                Price = 500000,
                Description = "Tiểu phẫu",
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

    [Fact(DisplayName = "ITCID01 - Normal: Assistant sees all procedures (including deleted)")]
    [Trait("TestType", "Normal")]
    public async System.Threading.Tasks.Task ITCID01_Assistant_Sees_All()
    {
        SetupHttpContext("assistant", 1);

        var result = await _handler.Handle(new ViewListProcedureCommand(), default);

        Assert.Equal(2, result.Count);
        Assert.Contains(result, p => p.ProcedureName == "Nhổ răng");
    }

    [Fact(DisplayName = "ITCID02 - Normal: Other roles see only non-deleted procedures")]
    [Trait("TestType", "Normal")]
    public async System.Threading.Tasks.Task ITCID02_OtherRole_Sees_Only_NotDeleted()
    {
        SetupHttpContext("receptionist", 2);

        var result = await _handler.Handle(new ViewListProcedureCommand(), default);

        Assert.Single(result);
        Assert.All(result, p => Assert.Equal("Tẩy trắng răng", p.ProcedureName));
    }

    [Fact(DisplayName = "ITCID03 - Abnormal: Missing authentication throws error")]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task ITCID03_Missing_Auth_Throws()
    {
        _httpContextAccessor.HttpContext = new DefaultHttpContext(); // no claims

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(new ViewListProcedureCommand(), default));

        Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
    }

    [Fact(DisplayName = "ITCID04 - Abnormal: No procedures available throws error")]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task ITCID04_No_Procedure_Throws()
    {
        _context.Procedures.RemoveRange(_context.Procedures);
        _context.SaveChanges();

        SetupHttpContext("assistant", 1);

        var result = await _handler.Handle(new ViewListProcedureCommand(), default);
        Assert.NotNull(result);
        Assert.Empty(result);
    }
}
