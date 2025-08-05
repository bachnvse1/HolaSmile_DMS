using Application.Constants;
using Application.Usecases.Receptionist.ViewPromotionProgram;
using Domain.Entities;
using HDMS_API.Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Infrastructure.Repositories;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.DotNet.Scaffolding.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Receptionists;

public class ViewDetailPromotionProgramHandlerIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly PromotionRepository _promotionRepo;
    private readonly ProcedureRepository _procedureRepo;
    private readonly UserCommonRepository _userCommonRepo;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ViewDetailPromotionProgramHandlerIntegrationTests()
    {

        var services = new ServiceCollection();
        services.AddMemoryCache();
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase($"ViewDetailPromotionTest_{Guid.NewGuid()}")
            .Options;
        var provider = services.BuildServiceProvider();
        var memoryCache = provider.GetRequiredService<IMemoryCache>();

        _context = new ApplicationDbContext(options);
        _promotionRepo = new PromotionRepository(_context);
        _procedureRepo = new ProcedureRepository(_context);
        _userCommonRepo = new UserCommonRepository(_context);
        _httpContextAccessor = new HttpContextAccessor();

        SeedData();
    }

    private void SeedData()
    {
        _context.Users.AddRange(
            new User { UserID = 1, Username = "0111111111", Fullname = "Receptionist A", Phone = "0111111111" },
            new User { UserID = 2, Username = "0111111112", Fullname = "Owner B", Phone = "0111111112" },
            new User { UserID = 3, Username = "0111111113", Fullname = "Patient C", Phone = "0111111113" }
        );

        _context.Procedures.Add(new Procedure
        {
            ProcedureId = 101,
            ProcedureName = "Tẩy trắng"
        });

        _context.DiscountPrograms.Add(new DiscountProgram
        {
            DiscountProgramID = 1,
            DiscountProgramName = "Summer Sale",
            CreateDate = DateTime.Today,
            EndDate = DateTime.Today.AddDays(7),
            CreateAt = DateTime.Now.AddDays(-2),
            UpdatedAt = DateTime.Now,
            CreatedBy = 1,
            UpdatedBy = 2,
            IsDelete = false,
            ProcedureDiscountPrograms = new List<ProcedureDiscountProgram>
            {
                new ProcedureDiscountProgram
                {
                    ProcedureId = 101,
                    DiscountAmount = 15
                }
            }
        });

        _context.SaveChanges();
    }

    private void SetupHttpContext(string role, int userId)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role),
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        _httpContextAccessor.HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) };
    }

    [Fact(DisplayName = "ITCID01 - Return promotion details successfully")]
    public async System.Threading.Tasks.Task ITCID01_Return_promotion_details_successfully()
    {
        SetupHttpContext("Receptionist", 1);
        var handler = new ViewDetailPromotionProgramHandler(_httpContextAccessor, _promotionRepo, _procedureRepo, _userCommonRepo);

        var command = new ViewDetailPromotionProgramCommand(1);
        var result = await handler.Handle(command, default);

        Assert.NotNull(result);
        Assert.Equal("Summer Sale", result.ProgramName);
        Assert.Equal("Receptionist A", result.CreateBy);
        Assert.Equal("Owner B", result.UpdateBy);
        Assert.Single(result.ListProcedure);
        Assert.Equal(101, result.ListProcedure[0].ProcedureId);
        Assert.Equal(15, result.ListProcedure[0].DiscountAmount);
    }

    [Fact(DisplayName = "ITCID02 - Throw if discount program not found")]
    public async System.Threading.Tasks.Task ITCID02_Throw_if_program_not_found()
    {
        SetupHttpContext("Receptionist", 1);
        var handler = new ViewDetailPromotionProgramHandler(_httpContextAccessor, _promotionRepo, _procedureRepo, _userCommonRepo);

        var command = new ViewDetailPromotionProgramCommand(999);
        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG119, ex.Message); // "Chương trình khuyến mãi không tồn tại"
    }

    [Fact(DisplayName = "ITCID03 - Throw if createdBy user not found")]
    public async System.Threading.Tasks.Task ITCID03_Throw_if_created_user_not_found()
    {
        var program = _context.DiscountPrograms.First(p => p.DiscountProgramID == 1);
        program.CreatedBy = 999;
        _context.SaveChanges();

        SetupHttpContext("Receptionist", 1);
        var handler = new ViewDetailPromotionProgramHandler(_httpContextAccessor, _promotionRepo, _procedureRepo, _userCommonRepo);

        var command = new ViewDetailPromotionProgramCommand(1);
        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG16, ex.Message); // "Người dùng không tồn tại"
    }
}
