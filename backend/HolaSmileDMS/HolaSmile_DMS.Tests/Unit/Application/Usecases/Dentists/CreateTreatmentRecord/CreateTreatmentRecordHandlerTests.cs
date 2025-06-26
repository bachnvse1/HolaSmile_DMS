using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentist.CreateTreatmentRecord;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Dentists.CreateTreatmentRecord;

public class CreateTreatmentRecordHandlerTests
{
    private CreateTreatmentRecordCommand GetValidCommand() => new()
    {
        AppointmentId = 10,
        DentistId = 2,
        ProcedureId = 1,
        Quantity = 1,
        UnitPrice = 500000,
        DiscountAmount = 50000,
        TreatmentDate = DateTime.Now
    };

    private (CreateTreatmentRecordHandler Handler, Mock<ITreatmentRecordRepository> RepoMock) SetupHandler(string role, int userId, CreateTreatmentRecordCommand command)
    {
        var repoMock = new Mock<ITreatmentRecordRepository>();
        var mapperMock = new Mock<IMapper>();
        var httpMock = new Mock<IHttpContextAccessor>();

        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role)
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

        return (new CreateTreatmentRecordHandler(repoMock.Object, mapperMock.Object, httpMock.Object), repoMock);
    }

    [Fact(DisplayName = "Abnormal - UTCID01 - AppointmentId = 0 should throw MSG28")]
    public async System.Threading.Tasks.Task UTCID01_AppointmentIdIsZero_ShouldThrowException()
    {
        var cmd = GetValidCommand();
        cmd.AppointmentId = 0;
        var (handler, _) = SetupHandler("Dentist", 1, cmd);

        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(cmd, default));
        Assert.Contains(MessageConstants.MSG.MSG28, ex.Message);
    }

    [Fact(DisplayName = "Abnormal - UTCID02 - ProcedureId = 0 should throw MSG16")]
    public async System.Threading.Tasks.Task UTCID02_ProcedureIdIsZero_ShouldThrowException()
    {
        var cmd = GetValidCommand();
        cmd.ProcedureId = 0;
        var (handler, _) = SetupHandler("Dentist", 1, cmd);

        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(cmd, default));
        Assert.Contains(MessageConstants.MSG.MSG16, ex.Message);
    }

    [Fact(DisplayName = "Abnormal - UTCID03 - Quantity = 0 should throw MSG73")]
    public async System.Threading.Tasks.Task UTCID03_QuantityIsZero_ShouldThrowException()
    {
        var cmd = GetValidCommand();
        cmd.Quantity = 0;
        var (handler, _) = SetupHandler("Dentist", 1, cmd);

        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(cmd, default));
        Assert.Contains(MessageConstants.MSG.MSG88, ex.Message);
    }

    [Fact(DisplayName = "Abnormal - UTCID04 - UnitPrice = 0 should throw MSG20")]
    public async System.Threading.Tasks.Task UTCID04_UnitPriceIsZero_ShouldThrowException()
    {
        var cmd = GetValidCommand();
        cmd.UnitPrice = 0;
        var (handler, _) = SetupHandler("Dentist", 1, cmd);

        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(cmd, default));
        Assert.Contains(MessageConstants.MSG.MSG20, ex.Message);
    }

    [Fact(DisplayName = "Boundary - UTCID05 - DiscountAmount exceeds total should throw")]
    public async System.Threading.Tasks.Task UTCID05_DiscountAmountExceedsTotal_ShouldThrowException()
    {
        var cmd = GetValidCommand();
        cmd.DiscountAmount = 9999999;
        var (handler, _) = SetupHandler("Dentist", 1, cmd);

        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(cmd, default));
        Assert.Contains(MessageConstants.MSG.MSG20, ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact(DisplayName = "Abnormal - UTCID06 - Role is not dentist should throw Unauthorized")]
    public async System.Threading.Tasks.Task UTCID06_RoleIsNotDentist_ShouldThrowUnauthorized()
    {
        var cmd = GetValidCommand();
        var (handler, _) = SetupHandler("Patient", 2, cmd);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(cmd, default));
    }

    [Fact(DisplayName = "Normal - UTCID07 - Valid input should return success")]
    public async System.Threading.Tasks.Task UTCID07_ValidInput_ShouldReturnSuccess()
    {
        var cmd = GetValidCommand();
        var (handler, _) = SetupHandler("Dentist", 1, cmd);

        var result = await handler.Handle(cmd, default);
        Assert.Equal(MessageConstants.MSG.MSG31, result);
    }

    [Fact(DisplayName = "Abnormal - UTCID08 - HttpContext is null should throw Unauthorized")]
    public async System.Threading.Tasks.Task UTCID08_HttpContextIsNull_ShouldThrowUnauthorized()
    {
        var cmd = GetValidCommand();

        var repoMock = new Mock<ITreatmentRecordRepository>();
        var mapperMock = new Mock<IMapper>();
        var httpMock = new Mock<IHttpContextAccessor>();
        httpMock.Setup(h => h.HttpContext).Returns((HttpContext)null!);

        var handler = new CreateTreatmentRecordHandler(repoMock.Object, mapperMock.Object, httpMock.Object);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(cmd, default));
    }

    [Fact(DisplayName = "Abnormal - UTCID09 - TreatmentDate null should throw MSG28")]
    public async System.Threading.Tasks.Task UTCID09_TreatmentDateIsDefault_ShouldThrowException()
    {
        var cmd = GetValidCommand();
        cmd.TreatmentDate = default;
        var (handler, _) = SetupHandler("Dentist", 1, cmd);

        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(cmd, default));
        Assert.Contains(MessageConstants.MSG.MSG83, ex.Message);
    }

    [Fact(DisplayName = "Normal - UTCID10 - Zero discount is valid should return success")]
    public async System.Threading.Tasks.Task UTCID10_DiscountZero_ShouldPass()
    {
        var cmd = GetValidCommand();
        cmd.DiscountAmount = 0;
        var (handler, _) = SetupHandler("Dentist", 2, cmd);

        var result = await handler.Handle(cmd, default);
        Assert.Equal(MessageConstants.MSG.MSG31, result);
    }
}