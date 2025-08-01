using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Receptionist.CreateDiscountProgram;
using Application.Usecases.Receptionist.UpdateDiscountProgram;
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

public class UpdateDiscountProgramHandlerIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly PromotionRepository _promotionRepo;
    private readonly ProcedureRepository _procedureRepo;
    private readonly OwnerRepository _ownerRepo;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly Mock<IMediator> _mediatorMock = new();

    public UpdateDiscountProgramHandlerIntegrationTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"UpdateDiscountProgramTest_{Guid.NewGuid()}")
            .Options;
        _context = new ApplicationDbContext(options);
        _promotionRepo = new PromotionRepository(_context);
        _procedureRepo = new ProcedureRepository(_context);
        _ownerRepo = new OwnerRepository(_context);
        _httpContextAccessor = new HttpContextAccessor();
        SeedData();
    }

    private void SeedData()
    {
        _context.Users.Add(new User { UserID = 2, Username = "receptionist", Fullname = "Lễ tân A", Phone = "0123" });
        _context.Users.Add(new User { UserID = 3, Username = "owner", Fullname = "Owner B", Phone = "0456" });

        _context.Owners.Add(new Owner { OwnerId = 1, UserId = 3 });

        _context.Procedures.AddRange(
            new Procedure { ProcedureId = 101, ProcedureName = "Tẩy trắng" },
            new Procedure { ProcedureId = 102, ProcedureName = "Nhổ răng" }
        );

        _context.DiscountPrograms.Add(new DiscountProgram
        {
            DiscountProgramID = 1,
            DiscountProgramName = "Summer Sale",
            CreateDate = DateTime.Today.AddDays(-5),
            EndDate = DateTime.Today.AddDays(5)
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

    [Fact(DisplayName = "ITCID01 - Successfully updates discount program")]
    public async System.Threading.Tasks.Task ITCID01_Successfully_updates_discount_program()
    {
        SetupHttpContext("Receptionist", 2);
        var handler = new UpdateDiscountProgramHandler(_httpContextAccessor, _promotionRepo, _procedureRepo, _ownerRepo, _mediatorMock.Object);

        var command = new UpdateDiscountProgramCommand
        {
            ProgramId = 1,
            ProgramName = "Summer Sale Updated",
            StartDate = DateTime.Today,
            EndDate = DateTime.Today.AddDays(10),
            ListProcedure = new List<ProcedureDiscountProgramDTO>
            {
                new ProcedureDiscountProgramDTO { ProcedureId = 101, DiscountAmount = 10 },
                new ProcedureDiscountProgramDTO { ProcedureId = 102, DiscountAmount = 20 },
            }
        };

        var result = await handler.Handle(command, default);

        Assert.True(result);

        var updated = await _context.DiscountPrograms.FindAsync(1);
        Assert.Equal("Summer Sale Updated", updated!.DiscountProgramName);
        Assert.Equal(2, updated.UpdatedBy);

        var discounts = _context.ProcedureDiscountPrograms.Where(p => p.DiscountProgramId == 1).ToList();
        Assert.Equal(2, discounts.Count);
    }

    [Fact(DisplayName = "ITCID02 - Throw if discount program not found")]
    public async System.Threading.Tasks.Task ITCID02_Throw_if_discount_program_not_found()
    {
        SetupHttpContext("Receptionist", 2);
        var handler = new UpdateDiscountProgramHandler(_httpContextAccessor, _promotionRepo, _procedureRepo, _ownerRepo, _mediatorMock.Object);

        var command = new UpdateDiscountProgramCommand
        {
            ProgramId = 999,
            ProgramName = "Test",
            StartDate = DateTime.Today,
            EndDate = DateTime.Today.AddDays(1),
            ListProcedure = new List<ProcedureDiscountProgramDTO>
            {
                new ProcedureDiscountProgramDTO { ProcedureId = 101, DiscountAmount = 10 },
            }
        };

        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, default));
        Assert.Equal("Chương trình khuyến mãi không tồn tại", ex.Message);
    }

    [Fact(DisplayName = "ITCID03 - Throw if invalid procedure ID in list")]
    public async System.Threading.Tasks.Task ITCID03_Throw_if_invalid_procedure_id()
    {
        SetupHttpContext("Receptionist", 2);
        var handler = new UpdateDiscountProgramHandler(_httpContextAccessor, _promotionRepo, _procedureRepo, _ownerRepo, _mediatorMock.Object);

        var command = new UpdateDiscountProgramCommand
        {
            ProgramId = 1,
            ProgramName = "Update",
            StartDate = DateTime.Today,
            EndDate = DateTime.Today.AddDays(1),
            ListProcedure = new List<ProcedureDiscountProgramDTO>
            {
                new ProcedureDiscountProgramDTO { ProcedureId = 999, DiscountAmount = 10 },
            }
        };

        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG99, ex.Message);
    }

    [Fact(DisplayName = "ITCID04 - Throw if DiscountAmount is negative")]
    public async System.Threading.Tasks.Task ITCID04_Throw_if_discount_negative()
    {
        SetupHttpContext("Receptionist", 2);
        var handler = new UpdateDiscountProgramHandler(_httpContextAccessor, _promotionRepo, _procedureRepo, _ownerRepo, _mediatorMock.Object);

        var command = new UpdateDiscountProgramCommand
        {
            ProgramId = 1,
            ProgramName = "Update",
            StartDate = DateTime.Today,
            EndDate = DateTime.Today.AddDays(1),
            ListProcedure = new List<ProcedureDiscountProgramDTO>
            {
                new ProcedureDiscountProgramDTO { ProcedureId = 101, DiscountAmount = -5 },
            }
        };

        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG125, ex.Message);
    }

    [Fact(DisplayName = "ITCID05 - Throw if update fails")]
    public async System.Threading.Tasks.Task ITCID05_Throw_if_update_fails()
    {
        SetupHttpContext("Receptionist", 2);
        var fakeRepo = new Mock<IPromotionRepository>();
        fakeRepo.Setup(x => x.GetDiscountProgramByIdAsync(1)).ReturnsAsync(new DiscountProgram());
        fakeRepo.Setup(x => x.UpdateDiscountProgramAsync(It.IsAny<DiscountProgram>())).ReturnsAsync(false);

        var handler = new UpdateDiscountProgramHandler(_httpContextAccessor, fakeRepo.Object, _procedureRepo, _ownerRepo, _mediatorMock.Object);

        var command = new UpdateDiscountProgramCommand
        {
            ProgramId = 1,
            ProgramName = "Update",
            StartDate = DateTime.Today,
            EndDate = DateTime.Today.AddDays(1),
            ListProcedure = new List<ProcedureDiscountProgramDTO>
            {
                new ProcedureDiscountProgramDTO { ProcedureId = 101, DiscountAmount = 10 },
            }
        };

        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG58, ex.Message);
    }
}
