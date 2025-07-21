using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentists.CreateOrthodonticTreatmentPlan;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Dentists;

public class CreateOrthodonticTreatmentPlanHandlerTests
{
    private readonly Mock<IOrthodonticTreatmentPlanRepository> _repoMock = new();
    private readonly Mock<IPatientRepository> _patientRepoMock = new();
    private readonly Mock<IHttpContextAccessor> _contextMock = new();
    private readonly Mock<IMapper> _mapperMock = new();
    private readonly Mock<IMediator> _mediaMock = new();

    private CreateOrthodonticTreatmentPlanHandler CreateHandlerWithRole(string role, string userId = "1")
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.GivenName, "Dr. Test")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var user = new ClaimsPrincipal(identity);
        _contextMock.Setup(x => x.HttpContext).Returns(new DefaultHttpContext { User = user });

        return new CreateOrthodonticTreatmentPlanHandler(
            _repoMock.Object,
            _patientRepoMock.Object,
            _contextMock.Object,
            _mapperMock.Object,
            _mediaMock.Object);
    }

    [Fact(DisplayName = "UTCID01 - Valid input by Dentist should succeed")]
    public async System.Threading.Tasks.Task ValidInput_ByDentist_ShouldSucceed()
    {
        var handler = CreateHandlerWithRole("Dentist");
        var command = new CreateOrthodonticTreatmentPlanCommand
        {
            PatientId = 1,
            DentistId = 1,
            PlanTitle = "Plan",
            TreatmentPlanContent = "Content",
            TotalCost = 100
        };

        _mapperMock.Setup(m => m.Map<OrthodonticTreatmentPlan>(It.IsAny<CreateOrthodonticTreatmentPlanCommand>()))
                   .Returns(new OrthodonticTreatmentPlan());

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.Equal(MessageConstants.MSG.MSG37, result);
    }

    [Fact(DisplayName = "UTCID02 - Null user should throw unauthorized")]
    public async System.Threading.Tasks.Task NullUser_ShouldThrowUnauthorized()
    {
        _contextMock.Setup(x => x.HttpContext).Returns<HttpContext>(null);
        var handler = new CreateOrthodonticTreatmentPlanHandler(_repoMock.Object, _patientRepoMock.Object, _contextMock.Object, _mapperMock.Object, _mediaMock.Object);

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(new CreateOrthodonticTreatmentPlanCommand(), CancellationToken.None));

        Assert.Equal(MessageConstants.MSG.MSG17, ex.Message);
    }

    [Fact(DisplayName = "UTCID03 - Role not Dentist or Assistant should throw unauthorized")]
    public async System.Threading.Tasks.Task InvalidRole_ShouldThrow()
    {
        var handler = CreateHandlerWithRole("Receptionist");

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(new CreateOrthodonticTreatmentPlanCommand(), CancellationToken.None));

        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }

    [Fact(DisplayName = "UTCID04 - PatientId <= 0 should throw")]
    public async System.Threading.Tasks.Task InvalidPatientId_ShouldThrow()
    {
        var handler = CreateHandlerWithRole("Dentist");

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            handler.Handle(new CreateOrthodonticTreatmentPlanCommand { PatientId = 0 }, CancellationToken.None));

        Assert.Equal(MessageConstants.MSG.MSG27, ex.Message);
    }

    [Fact(DisplayName = "UTCID05 - DentistId <= 0 should throw")]
    public async System.Threading.Tasks.Task InvalidDentistId_ShouldThrow()
    {
        var handler = CreateHandlerWithRole("Assistant");

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            handler.Handle(new CreateOrthodonticTreatmentPlanCommand { PatientId = 1, DentistId = 0 }, CancellationToken.None));

        Assert.Equal(MessageConstants.MSG.MSG42, ex.Message);
    }

    [Fact(DisplayName = "UTCID06 - Empty PlanTitle should throw")]
    public async System.Threading.Tasks.Task EmptyPlanTitle_ShouldThrow()
    {
        var handler = CreateHandlerWithRole("Dentist");

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            handler.Handle(new CreateOrthodonticTreatmentPlanCommand
            {
                PatientId = 1,
                DentistId = 1,
                PlanTitle = "",
                TreatmentPlanContent = "abc"
            }, CancellationToken.None));

        Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
    }

    [Fact(DisplayName = "UTCID07 - Empty TreatmentPlanContent should throw")]
    public async System.Threading.Tasks.Task EmptyContent_ShouldThrow()
    {
        var handler = CreateHandlerWithRole("Dentist");

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            handler.Handle(new CreateOrthodonticTreatmentPlanCommand
            {
                PatientId = 1,
                DentistId = 1,
                PlanTitle = "abc",
                TreatmentPlanContent = "  "
            }, CancellationToken.None));

        Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
    }

    [Fact(DisplayName = "UTCID08 - Negative TotalCost should throw")]
    public async System.Threading.Tasks.Task NegativeTotalCost_ShouldThrow()
    {
        var handler = CreateHandlerWithRole("Dentist");

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            handler.Handle(new CreateOrthodonticTreatmentPlanCommand
            {
                PatientId = 1,
                DentistId = 1,
                PlanTitle = "abc",
                TreatmentPlanContent = "abc",
                TotalCost = -100
            }, CancellationToken.None));

        Assert.Equal(MessageConstants.MSG.MSG82, ex.Message);
    }
}
