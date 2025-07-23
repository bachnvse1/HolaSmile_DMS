using System.Security.Claims;
using Application.Common.Mappings;
using Application.Constants;
using Application.Usecases.UserCommon.ViewProcedures;
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

public class ViewDetailProcedureHandlerIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly ViewDetailProcedureHandler _handler;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ViewDetailProcedureHandlerIntegrationTests()
    {
        var services = new ServiceCollection();
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase("TestDb_ViewDetailProcedure"));

        services.AddMemoryCache();
        services.AddHttpContextAccessor();
        services.AddAutoMapper(typeof(ViewProcedureDto).Assembly);

        var provider = services.BuildServiceProvider();
        _context = provider.GetRequiredService<ApplicationDbContext>();
        _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();
        var mapper = provider.GetRequiredService<IMapper>();
        var memoryCache = provider.GetRequiredService<IMemoryCache>();

        SeedData();

        var userCommonRepo = new UserCommonRepository(
            _context,
            new Mock<IEmailService>().Object
        );

        _handler = new ViewDetailProcedureHandler(
            new ProcedureRepository(_context),
            userCommonRepo,
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
            new User { UserID = 1, Username = "0111111111", Fullname = "Assistant A", Phone = "0111111111" },
            new User { UserID = 2, Username = "0111111112", Fullname = "Dentist B", Phone = "0111111112" }
        );

        _context.Procedures.AddRange(
            new Procedure
            {
                ProcedureId = 1,
                ProcedureName = "Tẩy trắng răng",
                Description = "Thẩm mỹ",
                Price = 1000000,
                CreatedBy = 1,
                UpdatedBy = 2,
                IsDeleted = false
            },
            new Procedure
            {
                ProcedureId = 2,
                ProcedureName = "Nhổ răng",
                Description = "Tiểu phẫu",
                Price = 500000,
                CreatedBy = 1,
                UpdatedBy = 2,
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

    [Fact(DisplayName = "ITCID01 - Assistant views deleted procedure successfully")]
    [Trait("TestType", "Normal")]
    public async System.Threading.Tasks.Task ITCID01_Assistant_View_Deleted_Procedure()
    {
        SetupHttpContext("assistant", 1);

        var result = await _handler.Handle(new ViewDetailProcedureCommand { proceduredId = 2 }, default);

        Assert.NotNull(result);
        Assert.Equal("Nhổ răng", result.ProcedureName);
        Assert.Equal("Assistant A", result.CreatedBy);
        Assert.Equal("Dentist B", result.UpdateBy);
    }

    [Fact(DisplayName = "ITCID02 - Other role views non-deleted procedure successfully")]
    [Trait("TestType", "Normal")]
    public async System.Threading.Tasks.Task ITCID02_OtherRole_View_NotDeleted_Procedure()
    {
        SetupHttpContext("receptionist", 2);

        var result = await _handler.Handle(new ViewDetailProcedureCommand { proceduredId = 1 }, default);

        Assert.NotNull(result);
        Assert.Equal("Tẩy trắng răng", result.ProcedureName);
    }

    [Fact(DisplayName = "ITCID03 - Other role views deleted procedure throws MSG16")]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task ITCID03_OtherRole_View_Deleted_Throws()
    {
        SetupHttpContext("receptionist", 2);

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            _handler.Handle(new ViewDetailProcedureCommand { proceduredId = 2 }, default));

        Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
    }

    [Fact(DisplayName = "ITCID04 - Supply not found throws MSG16")]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task ITCID04_Procedure_NotFound_Throws()
    {
        SetupHttpContext("assistant", 1);

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            _handler.Handle(new ViewDetailProcedureCommand { proceduredId = 999 }, default));

        Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
    }

    [Fact(DisplayName = "ITCID05 - Missing authentication throws error")]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task ITCID05_Missing_Auth_Throws()
    {
        _httpContextAccessor.HttpContext = new DefaultHttpContext(); // no claims

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(new ViewDetailProcedureCommand { proceduredId = 1 }, default));

        Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
    }
}
