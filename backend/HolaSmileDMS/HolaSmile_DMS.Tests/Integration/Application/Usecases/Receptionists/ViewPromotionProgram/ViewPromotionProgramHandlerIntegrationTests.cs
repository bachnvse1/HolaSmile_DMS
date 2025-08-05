using Application.Constants;
using Application.Usecases.Receptionist.ViewPromotionProgram;
using Domain.Entities;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Receptionists;

public class ViewPromotionProgramHandlerIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly PromotionRepository _promotionRepo;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ViewPromotionProgramHandlerIntegrationTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase($"ViewPromotionProgramTests_{Guid.NewGuid()}")
            .Options;

        _context = new ApplicationDbContext(options);
        _promotionRepo = new PromotionRepository(_context);
        _httpContextAccessor = new HttpContextAccessor();

        SeedData();
    }

    private void SeedData()
    {
        _context.Users.AddRange(
            new User { UserID = 1, Username = "receptionist", Fullname = "Receptionist A", Phone = "0111111111" },
            new User { UserID = 2, Username = "owner", Fullname = "Owner B", Phone = "0222222222" },
            new User { UserID = 3, Username = "patient", Fullname = "Patient C", Phone = "0333333333" }
        );

        _context.DiscountPrograms.Add(new DiscountProgram
        {
            DiscountProgramID = 1,
            DiscountProgramName = "Summer Sale",
            CreateDate = DateTime.Today.AddDays(-5),
            EndDate = DateTime.Today.AddDays(5),
            IsDelete = false
        });

        _context.DiscountPrograms.Add(new DiscountProgram
        {
            DiscountProgramID = 2,
            DiscountProgramName = "Winter Sale",
            CreateDate = DateTime.Today.AddDays(-10),
            EndDate = DateTime.Today.AddDays(-1),
            IsDelete = true
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

    [Fact(DisplayName = "ITCID01 - Throw if role is administrator")]
    public async System.Threading.Tasks.Task ITCID01_Throw_if_role_is_not_receptionist_or_owner()
    {
        SetupHttpContext("administrator", 3);
        var handler = new ViewPromotionProgramHandler(_httpContextAccessor, _promotionRepo, null!);

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(new ViewPromotionProgramCommand(), default));
        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }

    [Fact(DisplayName = "ITCID02 - Return empty list if no promotion programs")]
    public async System.Threading.Tasks.Task ITCID02_Return_empty_list_if_no_programs()
    {
        _context.DiscountPrograms.RemoveRange(_context.DiscountPrograms);
        _context.SaveChanges();

        SetupHttpContext("Receptionist", 1);
        var handler = new ViewPromotionProgramHandler(_httpContextAccessor, _promotionRepo, null!);

        var result = await handler.Handle(new ViewPromotionProgramCommand(), default);

        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact(DisplayName = "ITCID03 - Return promotion list for receptionist")]
    public async System.Threading.Tasks.Task ITCID03_Return_program_list_for_receptionist()
    {
        SetupHttpContext("Receptionist", 1);
        var handler = new ViewPromotionProgramHandler(_httpContextAccessor, _promotionRepo, null!);

        var result = await handler.Handle(new ViewPromotionProgramCommand(), default);

        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.Contains(result, p => p.DiscountProgramName == "Summer Sale");
    }

    [Fact(DisplayName = "ITCID04 - Return promotion list for owner")]
    public async System.Threading.Tasks.Task ITCID04_Return_program_list_for_owner()
    {
        SetupHttpContext("Owner", 2);
        var handler = new ViewPromotionProgramHandler(_httpContextAccessor, _promotionRepo, null!);

        var result = await handler.Handle(new ViewPromotionProgramCommand(), default);

        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
    }
}
