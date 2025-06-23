using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentist.CreateTreatmentRecord;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace Tests.Unit.Application.Usecases.Dentist;

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

    // 🔵 Abnormal Case: AppointmentId is 0 → should throw exception
    [Fact]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task A_AppointmentIdIsZero_ShouldThrowException()
    {
        var cmd = GetValidCommand();
        cmd.AppointmentId = 0;
        var (handler, _) = SetupHandler("Dentist", 12, cmd);

        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(cmd, default));
        Assert.Contains(MessageConstants.MSG.MSG28, ex.Message);
    }

    // 🟢 Normal Case: Valid input → should return success
    [Fact]
    [Trait("TestType", "Normal")]
    public async System.Threading.Tasks.Task N_ValidInput_ShouldReturnSuccessMessage()
    {
        var cmd = GetValidCommand();
        var (handler, _) = SetupHandler("Dentist", 2, cmd);

        var result = await handler.Handle(cmd, default);
        Assert.Equal(MessageConstants.MSG.MSG31, result);
    }

    // 🟡 Boundary Case: DiscountAmount too high → should throw
    [Fact]
    [Trait("TestType", "Boundary")]
    public async System.Threading.Tasks.Task B_DiscountExceedsTotal_ShouldThrowException()
    {
        var cmd = GetValidCommand();
        cmd.DiscountAmount = 9999999;
        var (handler, _) = SetupHandler("Dentist", 2, cmd);

        await Assert.ThrowsAsync<Exception>(() => handler.Handle(cmd, default));
    }

    // 🔵 Abnormal Case: Role is not dentist → should throw unauthorized
    [Fact]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task A_InvalidRole_ShouldThrowUnauthorized()
    {
        var cmd = GetValidCommand();
        var (handler, _) = SetupHandler("Patient", 2, cmd);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(cmd, default));
    }
}
