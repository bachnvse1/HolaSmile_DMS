using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentists.UpdateOrthodonticTreatmentPlan;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Dentists;

public class EditOrthodonticTreatmentPlanHandlerTests
{
    private readonly Mock<IOrthodonticTreatmentPlanRepository> _repoMock;
    private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
    private readonly Mock<IMapper> _mapperMock;
    private readonly Mock<IMediator> _mediatorMock;
    private readonly EditOrthodonticTreatmentPlanHandler _handler;

    public EditOrthodonticTreatmentPlanHandlerTests()
    {
        _repoMock = new Mock<IOrthodonticTreatmentPlanRepository>();
        _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
        _mapperMock = new Mock<IMapper>();
        _mediatorMock = new Mock<IMediator>();

        _handler = new EditOrthodonticTreatmentPlanHandler(
            _repoMock.Object,
            _httpContextAccessorMock.Object,
            _mapperMock.Object, 
            _mediatorMock.Object
        );
    }

    private void SetupHttpContext(string? role = null, string? userId = "1")
    {
        var claims = new List<Claim>();
        if (role != null) claims.Add(new Claim(ClaimTypes.Role, role));
        if (userId != null) claims.Add(new Claim(ClaimTypes.NameIdentifier, userId));

        var identity = new ClaimsIdentity(claims);
        var principal = new ClaimsPrincipal(identity);
        var context = new DefaultHttpContext { User = principal };

        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID01_ShouldThrow_WhenNotLoggedIn()
    {
        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns((HttpContext)null!);

        var command = new EditOrthodonticTreatmentPlanCommand(new EditOrthodonticTreatmentPlanDto());
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID03_ShouldThrow_WhenPlanTitleIsEmpty()
    {
        SetupHttpContext(role: "Dentist");

        var dto = new EditOrthodonticTreatmentPlanDto
        {
            PlanTitle = ""
        };

        var command = new EditOrthodonticTreatmentPlanCommand(dto);
        var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID04_ShouldThrow_WhenTotalCostLessThanZero()
    {
        SetupHttpContext(role: "Dentist");

        var dto = new EditOrthodonticTreatmentPlanDto
        {
            PlanTitle = "Valid",
            TotalCost = -1
        };

        var command = new EditOrthodonticTreatmentPlanCommand(dto);
        var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG95, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID05_ShouldThrow_WhenPaymentMethodTooLong()
    {
        SetupHttpContext(role: "Dentist");

        var dto = new EditOrthodonticTreatmentPlanDto
        {
            PlanTitle = "Valid",
            TotalCost = 1000000,
            PaymentMethod = new string('x', 256)
        };

        var command = new EditOrthodonticTreatmentPlanCommand(dto);
        var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG87, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID06_ShouldThrow_WhenPlanNotFound()
    {
        SetupHttpContext(role: "Dentist");

        var dto = new EditOrthodonticTreatmentPlanDto
        {
            PlanId = 99,
            PlanTitle = "Valid",
            TotalCost = 1000000
        };

        _repoMock.Setup(x => x.GetPlanByPlanIdAsync(99, default)).ReturnsAsync((OrthodonticTreatmentPlan?)null);

        var command = new EditOrthodonticTreatmentPlanCommand(dto);
        var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        Assert.Equal("Không tìm thấy kế hoạch điều trị", ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID07_ShouldUpdateSuccessfully()
    {
        SetupHttpContext(role: "Dentist", userId: "2");

        var dto = new EditOrthodonticTreatmentPlanDto
        {
            PlanId = 5,
            PlanTitle = "New Plan",
            TotalCost = 2000000,
            PaymentMethod = "PayOS"
        };

        var plan = new OrthodonticTreatmentPlan { PlanId = 5 };

        _repoMock.Setup(x => x.GetPlanByPlanIdAsync(5, default)).ReturnsAsync(plan);
        _mapperMock.Setup(x => x.Map(dto, plan));
        _repoMock.Setup(x => x.UpdateAsync(plan)).Returns(System.Threading.Tasks.Task.CompletedTask);

        var command = new EditOrthodonticTreatmentPlanCommand(dto);
        var result = await _handler.Handle(command, default);

        Assert.Equal(MessageConstants.MSG.MSG107, result);
    }
}