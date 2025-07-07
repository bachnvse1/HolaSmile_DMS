using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentist.CreateOrthodonticTreatmentPlan;
using Xunit;
using Moq;
using System.Security.Claims;
using Application.Usecases.SendNotification;
using Microsoft.AspNetCore.Http;
using AutoMapper;
using FluentAssertions;
using MediatR;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Dentists;

public class CreateOrthodonticTreatmentPlanHandlerTests
{
    private readonly Mock<IOrthodonticTreatmentPlanRepository> _repoMock;
    private readonly Mock<IMapper> _mapperMock;
    private readonly Mock<IHttpContextAccessor> _contextMock;
    private readonly Mock<IMediator> _mediatorMock;

    public CreateOrthodonticTreatmentPlanHandlerTests()
    {
        _repoMock = new Mock<IOrthodonticTreatmentPlanRepository>();
        _mapperMock = new Mock<IMapper>();
        _contextMock = new Mock<IHttpContextAccessor>();
        _mediatorMock = new Mock<IMediator>();
    }

    private CreateOrthodonticTreatmentPlanHandler CreateHandler(string role, string userId = "1")
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.GivenName, "Dr. Bach")
        };

        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var context = new DefaultHttpContext { User = principal };

        _contextMock.Setup(x => x.HttpContext).Returns(context);

        return new CreateOrthodonticTreatmentPlanHandler(
            _repoMock.Object,
            _contextMock.Object,
            _mapperMock.Object,
            _mediatorMock.Object);
    }

    [Fact(DisplayName = "[Integration - ITCID01 - Normal] Valid handler input should persist plan")]
    public async System.Threading.Tasks.Task ValidInput_ShouldCallAddAsync()
    {
        var command = new CreateOrthodonticTreatmentPlanCommand
        {
            PatientId = 1,
            DentistId = 1,
            PlanTitle = "Braces",
            TreatmentPlanContent = "Full plan",
            TotalCost = 200
        };

        var handler = CreateHandler("Dentist");

        _mapperMock.Setup(m => m.Map<OrthodonticTreatmentPlan>(command))
                   .Returns(new OrthodonticTreatmentPlan { PlanId = 123 });

        var result = await handler.Handle(command, CancellationToken.None);

        _repoMock.Verify(r => r.AddAsync(It.IsAny<OrthodonticTreatmentPlan>(), It.IsAny<CancellationToken>()), Times.Once);
        _mediatorMock.Verify(m => m.Send(It.IsAny<SendNotificationCommand>(), It.IsAny<CancellationToken>()), Times.Once);
        result.Should().Be(MessageConstants.MSG.MSG37);
    }

    [Fact(DisplayName = "[Integration - ITCID02 - Normal] Assistant role can create plan")]
    public async System.Threading.Tasks.Task AssistantRole_ShouldWork()
    {
        var command = new CreateOrthodonticTreatmentPlanCommand
        {
            PatientId = 1,
            DentistId = 1,
            PlanTitle = "Plan",
            TreatmentPlanContent = "abc",
            TotalCost = 100
        };

        var handler = CreateHandler("Assistant");

        _mapperMock.Setup(m => m.Map<OrthodonticTreatmentPlan>(It.IsAny<CreateOrthodonticTreatmentPlanCommand>()))
                   .Returns(new OrthodonticTreatmentPlan());

        var result = await handler.Handle(command, CancellationToken.None);

        result.Should().Be(MessageConstants.MSG.MSG37);
        _repoMock.Verify(r => r.AddAsync(It.IsAny<OrthodonticTreatmentPlan>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact(DisplayName = "[Integration - ITCID03 - Abnormal] Missing PatientId throws")]
    public async System.Threading.Tasks.Task MissingPatientId_ShouldThrow()
    {
        var handler = CreateHandler("Dentist");
        var command = new CreateOrthodonticTreatmentPlanCommand
        {
            PatientId = 0,
            DentistId = 1,
            PlanTitle = "abc",
            TreatmentPlanContent = "abc"
        };

        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, CancellationToken.None));
        ex.Message.Should().Be(MessageConstants.MSG.MSG27);
    }

    [Fact(DisplayName = "[Integration - ITCID04 - Abnormal] Missing DentistId throws")]
    public async System.Threading.Tasks.Task MissingDentistId_ShouldThrow()
    {
        var handler = CreateHandler("Dentist");
        var command = new CreateOrthodonticTreatmentPlanCommand
        {
            PatientId = 1,
            DentistId = 0,
            PlanTitle = "abc",
            TreatmentPlanContent = "abc"
        };

        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, CancellationToken.None));
        ex.Message.Should().Be(MessageConstants.MSG.MSG42);
    }

    [Fact(DisplayName = "[Integration - ITCID05 - Abnormal] Missing PlanTitle throws")]
    public async System.Threading.Tasks.Task MissingPlanTitle_ShouldThrow()
    {
        var handler = CreateHandler("Dentist");
        var command = new CreateOrthodonticTreatmentPlanCommand
        {
            PatientId = 1,
            DentistId = 1,
            PlanTitle = " ",
            TreatmentPlanContent = "abc"
        };

        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, CancellationToken.None));
        ex.Message.Should().Be(MessageConstants.MSG.MSG07);
    }

    [Fact(DisplayName = "[Integration - ITCID06 - Abnormal] Negative TotalCost throws")]
    public async System.Threading.Tasks.Task NegativeTotalCost_ShouldThrow()
    {
        var handler = CreateHandler("Dentist");
        var command = new CreateOrthodonticTreatmentPlanCommand
        {
            PatientId = 1,
            DentistId = 1,
            PlanTitle = "Plan",
            TreatmentPlanContent = "abc",
            TotalCost = -50
        };

        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, CancellationToken.None));
        ex.Message.Should().Be(MessageConstants.MSG.MSG82);
    }

    [Fact(DisplayName = "[Integration - ITCID07 - Abnormal] Invalid role throws Unauthorized")]
    public async System.Threading.Tasks.Task InvalidRole_ShouldThrowUnauthorized()
    {
        var handler = CreateHandler("Receptionist");
        var command = new CreateOrthodonticTreatmentPlanCommand
        {
            PatientId = 1,
            DentistId = 1,
            PlanTitle = "Plan",
            TreatmentPlanContent = "abc"
        };

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(command, CancellationToken.None));
        ex.Message.Should().Be(MessageConstants.MSG.MSG26);
    }

    [Fact(DisplayName = "[Integration - ITCID08 - Abnormal] Too long PaymentMethod throws")]
    public async System.Threading.Tasks.Task LongPaymentMethod_ShouldThrow()
    {
        var handler = CreateHandler("Dentist");
        var command = new CreateOrthodonticTreatmentPlanCommand
        {
            PatientId = 1,
            DentistId = 1,
            PlanTitle = "Plan",
            TreatmentPlanContent = "abc",
            PaymentMethod = new string('x', 300)
        };

        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, CancellationToken.None));
        ex.Message.Should().Be(MessageConstants.MSG.MSG29);
    }
}
