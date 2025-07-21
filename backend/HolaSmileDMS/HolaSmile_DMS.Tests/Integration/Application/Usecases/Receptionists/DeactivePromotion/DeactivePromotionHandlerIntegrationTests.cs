using Application.Constants;
using Application.Usecases.Receptionist.De_ActivePromotion;
using Domain.Entities;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Receptionists;

public class DeactivePromotionHandlerIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly Promotionrepository _promotionRepo;
    private readonly ProcedureRepository _procedureRepo;
    private readonly OwnerRepository _ownerRepo;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly Mock<IMediator> _mediatorMock = new();

    public DeactivePromotionHandlerIntegrationTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"DeactivePromotionTest_{Guid.NewGuid()}")
            .Options;

        _context = new ApplicationDbContext(options);
        _promotionRepo = new Promotionrepository(_context);
        _procedureRepo = new ProcedureRepository(_context);
        _ownerRepo = new OwnerRepository(_context);
        _httpContextAccessor = new HttpContextAccessor();
        SeedData();
    }

    private void SeedData()
    {
        _context.Users.AddRange(
            new User { UserID = 2, Username = "receptionist", Fullname = "Lễ tân A", Phone = "0123" },
            new User { UserID = 3, Username = "owner", Fullname = "Owner B", Phone = "0456" }
        );

        _context.Owners.Add(new Owner { OwnerId = 1, UserId = 3 });

        _context.Procedures.Add(new Procedure { ProcedureId = 101, ProcedureName = "Tẩy trắng", Price = 1000000 });

        _context.DiscountPrograms.Add(new DiscountProgram
        {
            DiscountProgramID = 1,
            DiscountProgramName = "Summer Sale",
            CreateDate = DateTime.Today.AddDays(-5),
            EndDate = DateTime.Today.AddDays(5),
            IsDelete = false,
            ProcedureDiscountPrograms = new List<ProcedureDiscountProgram>
            {
                new ProcedureDiscountProgram { ProcedureId = 101, DiscountAmount = 10 }
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

    [Fact(DisplayName = "ITCID01 - Throw if user is not receptionist")]
    public async System.Threading.Tasks.Task ITCID01_Throw_if_user_is_not_receptionist()
    {
        SetupHttpContext("Patient", 2);
        var handler = new DeactivePromotionHandler(_httpContextAccessor, _promotionRepo, _procedureRepo, _ownerRepo, _mediatorMock.Object);

        var command = new DeactivePromotionCommand(1);

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }

    [Fact(DisplayName = "ITCID02 - Throw if discount program not found")]
    public async System.Threading.Tasks.Task ITCID02_Throw_if_program_not_found()
    {
        SetupHttpContext("Receptionist", 2);
        var handler = new DeactivePromotionHandler(_httpContextAccessor, _promotionRepo, _procedureRepo, _ownerRepo, _mediatorMock.Object);

        var command = new DeactivePromotionCommand(999);

        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG119, ex.Message);
    }

    [Fact(DisplayName = "ITCID03 - Throw if trying to activate when other program is active")]
    public async System.Threading.Tasks.Task ITCID03_Throw_if_other_program_active()
    {
        SetupHttpContext("Receptionist", 2);

        // Mark current program as inactive
        var current = await _context.DiscountPrograms.FindAsync(1);
        current!.IsDelete = true;
        _context.SaveChanges();

        // Add other active program
        _context.DiscountPrograms.Add(new DiscountProgram
        {
            DiscountProgramID = 2,
            DiscountProgramName = "Winter Sale",
            IsDelete = false,
            CreateDate = DateTime.Today,
            EndDate = DateTime.Today.AddDays(10),
            ProcedureDiscountPrograms = new List<ProcedureDiscountProgram>
            {
                new ProcedureDiscountProgram { ProcedureId = 101, DiscountAmount = 15 }
            }
        });
        _context.SaveChanges();

        var handler = new DeactivePromotionHandler(_httpContextAccessor, _promotionRepo, _procedureRepo, _ownerRepo, _mediatorMock.Object);

        var command = new DeactivePromotionCommand(1);

        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG121, ex.Message);
    }

    [Fact(DisplayName = "ITCID04 - Successfully deactivates a program")]
    public async System.Threading.Tasks.Task ITCID04_Successfully_deactivates_program()
    {
        SetupHttpContext("Receptionist", 2);
        var handler = new DeactivePromotionHandler(_httpContextAccessor, _promotionRepo, _procedureRepo, _ownerRepo, _mediatorMock.Object);

        var command = new DeactivePromotionCommand(1);

        var result = await handler.Handle(command, default);

        Assert.True(result);
        var updated = await _context.DiscountPrograms.FindAsync(1);
        Assert.True(updated!.IsDelete);
        Assert.Equal(2, updated.UpdatedBy);
    }

    [Fact(DisplayName = "ITCID05 - Successfully activates a program")]
    public async System.Threading.Tasks.Task ITCID05_Successfully_activates_program()
    {
        SetupHttpContext("Receptionist", 2);

        var program = await _context.DiscountPrograms.FindAsync(1);
        program!.IsDelete = true;
        _context.SaveChanges();

        var handler = new DeactivePromotionHandler(_httpContextAccessor, _promotionRepo, _procedureRepo, _ownerRepo, _mediatorMock.Object);

        var command = new DeactivePromotionCommand(1);

        var result = await handler.Handle(command, default);

        Assert.True(result);
        var updated = await _context.DiscountPrograms.FindAsync(1);
        Assert.False(updated!.IsDelete);
        Assert.Equal(2, updated.UpdatedBy);
    }
}
