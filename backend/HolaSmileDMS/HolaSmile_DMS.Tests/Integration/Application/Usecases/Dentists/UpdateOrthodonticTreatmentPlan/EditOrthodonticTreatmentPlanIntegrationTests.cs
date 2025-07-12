using System.Security.Claims;
using Application.Common.Mappings;
using Application.Constants;
using Application.Usecases.Dentist.UpdateOrthodonticTreatmentPlan;
using AutoMapper;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Dentists.UpdateOrthodonticTreatmentPlan;

public class EditOrthodonticTreatmentPlanIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IMediator _mediator;

    public EditOrthodonticTreatmentPlanIntegrationTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()) // tách DB mỗi test
            .Options;

        _context = new ApplicationDbContext(options);
        var config = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<OrthodonticTreatmentPlanProfile>(); // Thêm profile tương ứng
        });
        _mapper = config.CreateMapper();
        SeedData();
    }

    private void SeedData()
    {
        _context.OrthodonticTreatmentPlans.Add(new OrthodonticTreatmentPlan
        {
            PlanId = 5,
            PatientId = 1,
            DentistId = 2,
            PlanTitle = "Cũ",
            TotalCost = 10000000,
            CreatedAt = DateTime.Now,
            CreatedBy = 2,
            IsDeleted = false
        });

        _context.SaveChanges();
    }

    private EditOrthodonticTreatmentPlanHandler CreateHandler(string role, string userId)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId)
        };

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var user = new ClaimsPrincipal(identity);
        var context = new DefaultHttpContext { User = user };
        var accessor = new HttpContextAccessor { HttpContext = context };

        var repo = new OrthodonticTreatmentPlanRepository(_context, _mapper);
        return new EditOrthodonticTreatmentPlanHandler(repo, accessor, _mapper, _mediator);
    }

    [Fact(DisplayName = "ITCID01 - Cập nhật hợp lệ với Dentist")]
    public async System.Threading.Tasks.Task ITCID01_ShouldUpdatePlanSuccessfully()
    {
        var handler = CreateHandler("Dentist", "2");

        var dto = new EditOrthodonticTreatmentPlanDto
        {
            PlanId = 5,
            PlanTitle = "Chỉnh nha mới",
            TemplateName = "Temp A",
            TreatmentHistory = "Chưa điều trị",
            ReasonForVisit = "Răng lệch",
            ExaminationFindings = "Lệch nhẹ",
            IntraoralExam = "Tốt",
            XRayAnalysis = "Bình thường",
            ModelAnalysis = "Hẹp cung",
            TreatmentPlanContent = "Niềng trong 12 tháng",
            TotalCost = 20000000,
            PaymentMethod = "cash"
        };

        var result = await handler.Handle(new EditOrthodonticTreatmentPlanCommand(dto), default);

        var updated = await _context.OrthodonticTreatmentPlans.FindAsync(5);
        Assert.Equal("Chỉnh nha mới", updated.PlanTitle);
        Assert.Equal(20000000, updated.TotalCost);
        Assert.Equal("cash", updated.PaymentMethod);
        Assert.Equal(MessageConstants.MSG.MSG107, result);
    }

    [Fact(DisplayName = "ITCID02 - PlanId không tồn tại")]
    public async System.Threading.Tasks.Task ITCID02_ShouldThrow_WhenPlanNotFound()
    {
        var handler = CreateHandler("Dentist", "2");

        var dto = new EditOrthodonticTreatmentPlanDto
        {
            PlanId = 99,
            PlanTitle = "Valid",
            TotalCost = 10000000,
            PaymentMethod = "cash"
        };

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            handler.Handle(new EditOrthodonticTreatmentPlanCommand(dto), default));

        Assert.Equal("Không tìm thấy kế hoạch điều trị", ex.Message);
    }

    [Fact(DisplayName = "ITCID03 - TotalCost âm")]
    public async System.Threading.Tasks.Task ITCID03_ShouldThrow_WhenTotalCostNegative()
    {
        var handler = CreateHandler("Dentist", "2");

        var dto = new EditOrthodonticTreatmentPlanDto
        {
            PlanId = 5,
            PlanTitle = "Valid",
            TotalCost = -1,
            PaymentMethod = "cash"
        };

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            handler.Handle(new EditOrthodonticTreatmentPlanCommand(dto), default));

        Assert.Equal(MessageConstants.MSG.MSG95, ex.Message);
    }

    [Fact(DisplayName = "ITCID04 - PlanTitle rỗng")]
    public async System.Threading.Tasks.Task ITCID04_ShouldThrow_WhenPlanTitleEmpty()
    {
        var handler = CreateHandler("Dentist", "2");

        var dto = new EditOrthodonticTreatmentPlanDto
        {
            PlanId = 5,
            PlanTitle = "",
            TotalCost = 10000000,
            PaymentMethod = "cash"
        };

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            handler.Handle(new EditOrthodonticTreatmentPlanCommand(dto), default));

        Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
    }

    [Fact(DisplayName = "ITCID05 - Không phải role Dentist")]
    public async System.Threading.Tasks.Task ITCID05_ShouldThrow_WhenNotDentist()
    {
        var handler = CreateHandler("Assistant", "2");

        var dto = new EditOrthodonticTreatmentPlanDto
        {
            PlanId = 5,
            PlanTitle = "Valid",
            TotalCost = 10000000,
            PaymentMethod = "cash"
        };

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(new EditOrthodonticTreatmentPlanCommand(dto), default));

        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }
}