using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentist.CreateTreatmentRecord;
using Application.Usecases.SendNotification;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Dentists.CreateTreatmentRecord;

public class CreateTreatmentRecordHandlerTests
{
    private static readonly DateTime AppointmentDate = DateTime.Today;
    private static readonly DateTime FutureTreatmentDate = AppointmentDate.AddDays(1);

    private CreateTreatmentRecordCommand GetValidCommand() => new()
    {
        AppointmentId = 10,
        DentistId = 2,
        ProcedureId = 1,
        Quantity = 1,
        UnitPrice = 500000,
        DiscountAmount = 50000,
        TreatmentDate = FutureTreatmentDate
    };

    private Appointment MockAppointment => new()
    {
        AppointmentDate = AppointmentDate,
        AppointmentTime = new TimeSpan(10, 0, 0),
        PatientId = 1
    };

    private void SetupAppointment(Mock<IAppointmentRepository> appointmentRepo)
    {
        appointmentRepo.Setup(x => x.GetAppointmentByIdAsync(It.IsAny<int>()))
            .ReturnsAsync(MockAppointment);
    }

    private (CreateTreatmentRecordHandler Handler,
        Mock<ITreatmentRecordRepository> RepoMock,
        Mock<IAppointmentRepository> AppointmentRepoMock,
        Mock<IPatientRepository> PatientRepoMock,
        Mock<IMediator> MediatorMock) SetupHandler(string role, int userId, CreateTreatmentRecordCommand command)
    {
        var repoMock = new Mock<ITreatmentRecordRepository>();
        var mapperMock = new Mock<IMapper>();
        var httpMock = new Mock<IHttpContextAccessor>();
        var mediator = new Mock<IMediator>();
        var appointmentRepository = new Mock<IAppointmentRepository>();
        var patientRepository = new Mock<IPatientRepository>();

        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.GivenName, "Test Dentist")
        }));

        httpMock.Setup(h => h.HttpContext!.User).Returns(user);
        mapperMock.Setup(m => m.Map<TreatmentRecord>(It.IsAny<CreateTreatmentRecordCommand>()))
            .Returns(new TreatmentRecord
            {
                UnitPrice = command.UnitPrice,
                Quantity = command.Quantity,
                DiscountAmount = command.DiscountAmount,
                DiscountPercentage = command.DiscountPercentage
            });

        var handler = new CreateTreatmentRecordHandler(repoMock.Object, mapperMock.Object, httpMock.Object, mediator.Object, appointmentRepository.Object, patientRepository.Object);
        return (handler, repoMock, appointmentRepository, patientRepository, mediator);
    }

    [Fact(DisplayName = "UTCID01 - AppointmentId = 0 should throw MSG28")]
    public async System.Threading.Tasks.Task UTCID01_AppointmentIdIsZero_ShouldThrow()
    {
        var cmd = GetValidCommand();
        cmd.AppointmentId = 0;

        var (handler, _, appointmentRepo, _, _) = SetupHandler("Dentist", 1, cmd);
        SetupAppointment(appointmentRepo);

        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(cmd, default));
        Assert.Contains(MessageConstants.MSG.MSG28, ex.Message);
    }

    [Fact(DisplayName = "UTCID02 - ProcedureId = 0 should throw MSG16")]
    public async System.Threading.Tasks.Task UTCID02_ProcedureIdIsZero_ShouldThrow()
    {
        var cmd = GetValidCommand();
        cmd.ProcedureId = 0;

        var (handler, _, appointmentRepo, _, _) = SetupHandler("Dentist", 1, cmd);
        SetupAppointment(appointmentRepo);

        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(cmd, default));
        Assert.Contains(MessageConstants.MSG.MSG16, ex.Message);
    }

    [Fact(DisplayName = "UTCID03 - Quantity = 0 should throw MSG88")]
    public async System.Threading.Tasks.Task UTCID03_QuantityIsZero_ShouldThrow()
    {
        var cmd = GetValidCommand();
        cmd.Quantity = 0;

        var (handler, _, appointmentRepo, _, _) = SetupHandler("Dentist", 1, cmd);
        SetupAppointment(appointmentRepo);

        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(cmd, default));
        Assert.Contains(MessageConstants.MSG.MSG88, ex.Message);
    }

    [Fact(DisplayName = "UTCID04 - UnitPrice < 0 should throw MSG82")]
    public async System.Threading.Tasks.Task UTCID04_UnitPriceNegative_ShouldThrow()
    {
        var cmd = GetValidCommand();
        cmd.UnitPrice = -1;

        var (handler, _, appointmentRepo, _, _) = SetupHandler("Dentist", 1, cmd);
        SetupAppointment(appointmentRepo);

        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(cmd, default));
        Assert.Contains(MessageConstants.MSG.MSG82, ex.Message);
    }

    [Fact(DisplayName = "UTCID05 - DiscountAmount exceeds total should throw MSG20")]
    public async System.Threading.Tasks.Task UTCID05_DiscountAmountTooHigh_ShouldThrow()
    {
        var cmd = GetValidCommand();
        cmd.DiscountAmount = 9999999;

        var (handler, _, appointmentRepo, _, _) = SetupHandler("Dentist", 1, cmd);
        SetupAppointment(appointmentRepo);

        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(cmd, default));
        Assert.Contains(MessageConstants.MSG.MSG20, ex.Message);
    }

    [Fact(DisplayName = "UTCID06 - Role is not dentist should throw Unauthorized")]
    public async System.Threading.Tasks.Task UTCID06_NotDentistRole_ShouldThrow()
    {
        var cmd = GetValidCommand();

        var (handler, _, appointmentRepo, _, _) = SetupHandler("Patient", 1, cmd);
        SetupAppointment(appointmentRepo);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(cmd, default));
    }

    [Fact(DisplayName = "UTCID07 - Valid input should return success")]
    public async System.Threading.Tasks.Task UTCID07_ValidInput_ShouldReturnSuccess()
    {
        var cmd = GetValidCommand();

        var (handler, _, appointmentRepo, _, _) = SetupHandler("Dentist", 1, cmd);
        SetupAppointment(appointmentRepo);

        var result = await handler.Handle(cmd, default);
        Assert.Equal(MessageConstants.MSG.MSG31, result);
    }

    [Fact(DisplayName = "UTCID08 - HttpContext is null should throw Unauthorized")]
    public async System.Threading.Tasks.Task UTCID08_HttpContextNull_ShouldThrow()
    {
        var cmd = GetValidCommand();

        var repoMock = new Mock<ITreatmentRecordRepository>();
        var mapperMock = new Mock<IMapper>();
        var httpMock = new Mock<IHttpContextAccessor>();
        var mediator = new Mock<IMediator>();
        var appointmentRepo = new Mock<IAppointmentRepository>();
        var patientRepo = new Mock<IPatientRepository>();

        httpMock.Setup(h => h.HttpContext).Returns((HttpContext)null!);
        var handler = new CreateTreatmentRecordHandler(repoMock.Object, mapperMock.Object, httpMock.Object, mediator.Object, appointmentRepo.Object, patientRepo.Object);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(cmd, default));
    }

    [Fact(DisplayName = "UTCID09 - Discount 0 is valid and should pass")]
    public async System.Threading.Tasks.Task UTCID09_DiscountZero_ShouldPass()
    {
        var cmd = GetValidCommand();
        cmd.DiscountAmount = 0;

        var (handler, _, appointmentRepo, _, _) = SetupHandler("Dentist", 2, cmd);
        SetupAppointment(appointmentRepo);

        var result = await handler.Handle(cmd, default);
        Assert.Equal(MessageConstants.MSG.MSG31, result);
    }

    [Fact(DisplayName = "UTCID10 - DiscountPercentage > 100 should throw MSG20")]
    public async System.Threading.Tasks.Task UTCID10_DiscountPercentTooHigh_ShouldThrow()
    {
        var cmd = GetValidCommand();
        cmd.DiscountPercentage = 150;

        var (handler, _, appointmentRepo, _, _) = SetupHandler("Dentist", 2, cmd);
        SetupAppointment(appointmentRepo);

        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(cmd, default));
        Assert.Contains(MessageConstants.MSG.MSG20, ex.Message);
    }
}
