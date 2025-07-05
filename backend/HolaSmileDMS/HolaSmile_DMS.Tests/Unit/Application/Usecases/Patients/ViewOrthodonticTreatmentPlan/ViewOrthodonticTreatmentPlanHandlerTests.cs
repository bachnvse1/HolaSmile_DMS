using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Patients.ViewOrthodonticTreatmentPlan;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Patients.ViewOrthodonticTreatmentPlan;

public class ViewOrthodonticTreatmentPlanHandlerTests
{
    private readonly Mock<IOrthodonticTreatmentPlanRepository> _repoMock = new();
    private readonly Mock<IHttpContextAccessor> _httpMock = new();
    private readonly Mock<IUserCommonRepository> _userCommonRepoMock = new();

    private ViewOrthodonticTreatmentPlanHandler CreateHandler(ClaimsPrincipal user)
    {
        _httpMock.Setup(x => x.HttpContext).Returns(new DefaultHttpContext { User = user });
        return new ViewOrthodonticTreatmentPlanHandler(_repoMock.Object, _httpMock.Object, _userCommonRepoMock.Object);
    }

    private ClaimsPrincipal CreateUser(string role, int userId)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role)
        };
        return new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID01_Patient_View_Own_Record_Success()
    {
        var user = CreateUser("Patient", 10);
        var handler = CreateHandler(user);
        var command = new ViewOrthodonticTreatmentPlanCommand(1, 99);

        _userCommonRepoMock.Setup(x => x.GetUserIdByRoleTableIdAsync("Patient", 99)).ReturnsAsync(10);
        _repoMock.Setup(x => x.GetPlanByIdAsync(1, 99, It.IsAny<CancellationToken>())).ReturnsAsync(new OrthodonticTreatmentPlanDto());

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.NotNull(result);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID02_Patient_View_Other_Record_Throws_Unauthorized()
    {
        var user = CreateUser("Patient", 11);
        var handler = CreateHandler(user);
        var command = new ViewOrthodonticTreatmentPlanCommand(1, 99);

        _userCommonRepoMock.Setup(x => x.GetUserIdByRoleTableIdAsync("Patient", 99)).ReturnsAsync(10);

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(command, CancellationToken.None));
        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID03_No_Claims_Should_Throw_Unauthorized()
    {
        _httpMock.Setup(x => x.HttpContext).Returns<HttpContext>(null);
        var handler = new ViewOrthodonticTreatmentPlanHandler(_repoMock.Object, _httpMock.Object, _userCommonRepoMock.Object);

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(new ViewOrthodonticTreatmentPlanCommand(1, 1), CancellationToken.None));
        Assert.Equal(MessageConstants.MSG.MSG17, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID04_Invalid_Role_Throws_Unauthorized()
    {
        var user = CreateUser("Owner", 1);
        var handler = CreateHandler(user);

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(new ViewOrthodonticTreatmentPlanCommand(1, 1), CancellationToken.None));
        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID05_Dentist_View_Success()
    {
        var user = CreateUser("Dentist", 10);
        var handler = CreateHandler(user);
        var command = new ViewOrthodonticTreatmentPlanCommand(1, 99);

        _repoMock.Setup(x => x.GetPlanByIdAsync(1, 99, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new OrthodonticTreatmentPlanDto());

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.NotNull(result);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID06_Record_Not_Found_Throws()
    {
        var user = CreateUser("Dentist", 10);
        var handler = CreateHandler(user);
        var command = new ViewOrthodonticTreatmentPlanCommand(1, 99);

        _repoMock.Setup(x => x.GetPlanByIdAsync(1, 99, It.IsAny<CancellationToken>()))
            .ReturnsAsync((OrthodonticTreatmentPlanDto?)null);

        var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() => handler.Handle(command, CancellationToken.None));
        Assert.Equal(MessageConstants.MSG.MSG27, ex.Message);
    }
}