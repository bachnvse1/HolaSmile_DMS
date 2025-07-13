using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentist.DeactiveOrthodonticTreatmentPlan;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Dentists;

public class DeactiveOrthodonticTreatmentPlanHandlerTests
{
    private readonly Mock<IOrthodonticTreatmentPlanRepository> _repoMock;
    private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
    private readonly DeactiveOrthodonticTreatmentPlanHandler _handler;

    public DeactiveOrthodonticTreatmentPlanHandlerTests()
    {
        _repoMock = new Mock<IOrthodonticTreatmentPlanRepository>();
        _httpContextAccessorMock = new Mock<IHttpContextAccessor>();

        _handler = new DeactiveOrthodonticTreatmentPlanHandler(
            _repoMock.Object,
            _httpContextAccessorMock.Object
        );
    }

    private void SetupHttpContext(string? role = null, string? userId = "2", string? roleTableId = "10")
    {
        var claims = new List<Claim>();
        if (role != null) claims.Add(new Claim(ClaimTypes.Role, role));
        if (userId != null) claims.Add(new Claim(ClaimTypes.NameIdentifier, userId));
        if (roleTableId != null) claims.Add(new Claim("role_table_id", roleTableId));

        var identity = new ClaimsIdentity(claims);
        var principal = new ClaimsPrincipal(identity);
        var context = new DefaultHttpContext { User = principal };

        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID01_ShouldThrow_WhenNotLoggedIn()
    {
        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns((HttpContext)null!);
        var command = new DeactiveOrthodonticTreatmentPlanCommand { PlanId = 1 };

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(command, default));

        Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID02_ShouldThrow_WhenNotDentist()
    {
        SetupHttpContext(role: "Assistant", userId: "2", roleTableId: "10");
        var command = new DeactiveOrthodonticTreatmentPlanCommand { PlanId = 1 };

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(command, default));

        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID03_ShouldThrow_WhenRoleMissing()
    {
        SetupHttpContext(role: null, userId: "2", roleTableId: "10");
        var command = new DeactiveOrthodonticTreatmentPlanCommand { PlanId = 1 };

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(command, default));

        Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID04_ShouldThrow_WhenUserIdMissing()
    {
        SetupHttpContext(role: "Dentist", userId: null, roleTableId: "10");
        var command = new DeactiveOrthodonticTreatmentPlanCommand { PlanId = 1 };

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(command, default));

        Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID05_ShouldThrow_WhenPlanNotFound()
    {
        SetupHttpContext(role: "Dentist", userId: "2", roleTableId: "10");
        _repoMock.Setup(r => r.GetPlanByPlanIdAsync(99, default)).ReturnsAsync((OrthodonticTreatmentPlan?)null);

        var command = new DeactiveOrthodonticTreatmentPlanCommand { PlanId = 99 };

        var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _handler.Handle(command, default));

        Assert.Equal("Không tìm thấy kế hoạch điều trị", ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID06_ShouldThrow_WhenDentistNotCreator()
    {
        // DentistID trong plan là 99, nhưng role_table_id là 10 => sai người
        SetupHttpContext(role: "Dentist", userId: "2", roleTableId: "10");

        var plan = new OrthodonticTreatmentPlan { PlanId = 5, DentistId = 99 };
        _repoMock.Setup(r => r.GetPlanByPlanIdAsync(5, default)).ReturnsAsync(plan);

        var command = new DeactiveOrthodonticTreatmentPlanCommand { PlanId = 5 };

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(command, default));

        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID07_ShouldUpdateSuccessfully_WhenAlreadyDeleted()
    {
        SetupHttpContext(role: "Dentist", userId: "2", roleTableId: "10");

        var plan = new OrthodonticTreatmentPlan { PlanId = 5, IsDeleted = true, DentistId = 10 };
        _repoMock.Setup(r => r.GetPlanByPlanIdAsync(5, default)).ReturnsAsync(plan);
        _repoMock.Setup(r => r.UpdateAsync(plan)).Returns(System.Threading.Tasks.Task.CompletedTask);

        var command = new DeactiveOrthodonticTreatmentPlanCommand { PlanId = 5 };
        var result = await _handler.Handle(command, default);

        Assert.True(plan.IsDeleted);
        Assert.Equal(2, plan.UpdatedBy);
        Assert.Equal(MessageConstants.MSG.MSG57, result);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID08_ShouldUpdateSuccessfully_WhenValidRequest()
    {
        SetupHttpContext(role: "Dentist", userId: "2", roleTableId: "10");

        var plan = new OrthodonticTreatmentPlan { PlanId = 5, IsDeleted = false, DentistId = 10 };
        _repoMock.Setup(r => r.GetPlanByPlanIdAsync(5, default)).ReturnsAsync(plan);
        _repoMock.Setup(r => r.UpdateAsync(plan)).Returns(System.Threading.Tasks.Task.CompletedTask);

        var command = new DeactiveOrthodonticTreatmentPlanCommand { PlanId = 5 };
        var result = await _handler.Handle(command, default);

        Assert.True(plan.IsDeleted);
        Assert.Equal(2, plan.UpdatedBy);
        Assert.Equal(MessageConstants.MSG.MSG57, result);
    }
}