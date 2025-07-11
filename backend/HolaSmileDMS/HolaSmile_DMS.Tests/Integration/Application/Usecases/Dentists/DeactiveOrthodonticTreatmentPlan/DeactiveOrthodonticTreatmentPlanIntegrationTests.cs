using System.Security.Claims;
using Application.Constants;
using Application.Usecases.Dentist.DeactiveOrthodonticTreatmentPlan;
using AutoMapper;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Dentists;

public class DeactiveOrthodonticTreatmentPlanIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public DeactiveOrthodonticTreatmentPlanIntegrationTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _mapper = new MapperConfiguration(cfg => { }).CreateMapper(); // Không cần profile ở đây
        SeedData();
    }

    private void SeedData()
    {
        _context.OrthodonticTreatmentPlans.Add(new OrthodonticTreatmentPlan
        {
            PlanId = 5,
            PatientId = 1,
            DentistId = 10,
            PlanTitle = "Chỉnh nha 2025",
            IsDeleted = false,
            CreatedAt = DateTime.Now,
            CreatedBy = 10
        });
        _context.SaveChanges();
    }

    private DeactiveOrthodonticTreatmentPlanHandler CreateHandler(string role, string userId, string roleTableId)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim("role_table_id", roleTableId)
        };

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        var context = new DefaultHttpContext { User = principal };

        var accessor = new HttpContextAccessor { HttpContext = context };
        var repo = new OrthodonticTreatmentPlanRepository(_context, _mapper);

        return new DeactiveOrthodonticTreatmentPlanHandler(repo, accessor);
    }

    [Fact(DisplayName = "ITCID01 - Dentist deactivates own plan successfully")]
    public async System.Threading.Tasks.Task ITCID01_ShouldDeactivatePlanSuccessfully()
    {
        var handler = CreateHandler("Dentist", "2", "10");

        var result = await handler.Handle(new DeactiveOrthodonticTreatmentPlanCommand(5), default);

        var updated = await _context.OrthodonticTreatmentPlans.FindAsync(5);
        Assert.True(updated.IsDeleted);
        Assert.Equal(2, updated.UpdatedBy);
        Assert.Equal(MessageConstants.MSG.MSG57, result);
    }

    [Fact(DisplayName = "ITCID02 - Dentist tries to deactivate other's plan => unauthorized")]
    public async System.Threading.Tasks.Task ITCID02_ShouldThrow_WhenDentistNotOwner()
    {
        var handler = CreateHandler("Dentist", "2", "99");

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(new DeactiveOrthodonticTreatmentPlanCommand(5), default));

        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }

    [Fact(DisplayName = "ITCID03 - Plan not found")]
    public async System.Threading.Tasks.Task ITCID03_ShouldThrow_WhenPlanNotFound()
    {
        var handler = CreateHandler("Dentist", "2", "10");

        var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            handler.Handle(new DeactiveOrthodonticTreatmentPlanCommand(999), default));

        Assert.Equal("Không tìm thấy kế hoạch điều trị", ex.Message);
    }

    [Fact(DisplayName = "ITCID04 - Role not Dentist")]
    public async System.Threading.Tasks.Task ITCID04_ShouldThrow_WhenRoleNotDentist()
    {
        var handler = CreateHandler("Assistant", "2", "10");

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(new DeactiveOrthodonticTreatmentPlanCommand(5), default));

        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }

    [Fact(DisplayName = "ITCID05 - Missing login throws")]
    public async System.Threading.Tasks.Task ITCID05_ShouldThrow_WhenNotLoggedIn()
    {
        var accessor = new HttpContextAccessor { HttpContext = null };
        var repo = new OrthodonticTreatmentPlanRepository(_context, _mapper);
        var handler = new DeactiveOrthodonticTreatmentPlanHandler(repo, accessor);

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(new DeactiveOrthodonticTreatmentPlanCommand(5), default));

        Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
    }
}