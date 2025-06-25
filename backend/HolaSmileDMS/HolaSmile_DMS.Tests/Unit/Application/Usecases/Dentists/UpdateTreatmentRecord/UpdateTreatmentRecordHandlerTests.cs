using System.Security.Claims;
using Application.Constants.Interfaces;
using Application.Usecases.Dentist.UpdateTreatmentRecord;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Dentists.UpdateTreatmentRecord;

public class UpdateTreatmentRecordHandlerTests
{
    private UpdateTreatmentRecordCommand GetValidCommand() => new()
    {
        TreatmentRecordId = 1,
        ToothPosition = "R1",
        Quantity = 2,
        UnitPrice = 500000,
        DiscountAmount = 50000,
        DiscountPercentage = 0,
        TotalAmount = 950000,
        TreatmentStatus = "Completed",
        Symptoms = "Pain",
        Diagnosis = "Cavity",
        TreatmentDate = DateTime.Today
    };

    private (UpdateTreatmentRecordHandler Handler, Mock<ITreatmentRecordRepository> RepoMock) SetupHandler(string role, int userId, UpdateTreatmentRecordCommand command)
    {
        var repoMock = new Mock<ITreatmentRecordRepository>();
        var httpMock = new Mock<IHttpContextAccessor>();

        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role)
        }));

        httpMock.Setup(h => h.HttpContext!.User).Returns(user);

        return (new UpdateTreatmentRecordHandler(repoMock.Object, httpMock.Object), repoMock);
    }

    [Fact(DisplayName = "Abnormal - UTCID01 - Role is not Dentist should throw Unauthorized")]
    public async System.Threading.Tasks.Task UTCID01_RoleIsNotDentist_ShouldThrow()
    {
        var cmd = GetValidCommand();
        var (handler, _) = SetupHandler("Patient", 1, cmd);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(cmd, default));
    }

    [Fact(DisplayName = "Abnormal - UTCID02 - Record does not exist should throw KeyNotFound")]
    public async System.Threading.Tasks.Task UTCID02_RecordNotFound_ShouldThrow()
    {
        var cmd = GetValidCommand();
        var (handler, repoMock) = SetupHandler("Dentist", 1, cmd);

        repoMock.Setup(r => r.GetTreatmentRecordByIdAsync(cmd.TreatmentRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TreatmentRecord?)null);

        await Assert.ThrowsAsync<KeyNotFoundException>(() => handler.Handle(cmd, default));
    }

    [Fact(DisplayName = "Abnormal - UTCID03 - HttpContext is null should throw Unauthorized")]
    public async System.Threading.Tasks.Task UTCID03_HttpContextNull_ShouldThrow()
    {
        var cmd = GetValidCommand();
        var repoMock = new Mock<ITreatmentRecordRepository>();
        var httpMock = new Mock<IHttpContextAccessor>();
        httpMock.Setup(h => h.HttpContext).Returns((HttpContext?)null);

        var handler = new UpdateTreatmentRecordHandler(repoMock.Object, httpMock.Object);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(cmd, default));
    }

    [Fact(DisplayName = "Normal - UTCID04 - Valid input should return true")]
    public async System.Threading.Tasks.Task UTCID04_ValidInput_ShouldReturnTrue()
    {
        var cmd = GetValidCommand();
        var (handler, repoMock) = SetupHandler("Dentist", 2, cmd);

        var record = new TreatmentRecord
        {
            TreatmentRecordID = cmd.TreatmentRecordId
        };

        repoMock.Setup(r => r.GetTreatmentRecordByIdAsync(cmd.TreatmentRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        repoMock.Setup(r => r.UpdatedTreatmentRecordAsync(It.IsAny<TreatmentRecord>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await handler.Handle(cmd, default);

        Assert.True(result);
    }

    [Fact(DisplayName = "Boundary - UTCID05 - DiscountAmount > TotalAmount should allow update (logic handled elsewhere)")]
    public async System.Threading.Tasks.Task UTCID05_DiscountExceedsTotal_ShouldStillUpdate()
    {
        var cmd = GetValidCommand();
        cmd.DiscountAmount = 9999999; // không validate tại đây
        var (handler, repoMock) = SetupHandler("Dentist", 3, cmd);

        var record = new TreatmentRecord
        {
            TreatmentRecordID = cmd.TreatmentRecordId
        };

        repoMock.Setup(r => r.GetTreatmentRecordByIdAsync(cmd.TreatmentRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        repoMock.Setup(r => r.UpdatedTreatmentRecordAsync(It.IsAny<TreatmentRecord>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await handler.Handle(cmd, default);

        Assert.True(result);
    }

    [Fact(DisplayName = "Normal - UTCID06 - Nullable fields left blank should not crash")]
    public async System.Threading.Tasks.Task UTCID06_NullableFieldsLeftBlank_ShouldUpdate()
    {
        var cmd = new UpdateTreatmentRecordCommand
        {
            TreatmentRecordId = 10
            // tất cả các field còn lại null
        };

        var (handler, repoMock) = SetupHandler("Dentist", 4, cmd);

        var record = new TreatmentRecord { TreatmentRecordID = cmd.TreatmentRecordId };

        repoMock.Setup(r => r.GetTreatmentRecordByIdAsync(cmd.TreatmentRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(record);

        repoMock.Setup(r => r.UpdatedTreatmentRecordAsync(It.IsAny<TreatmentRecord>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await handler.Handle(cmd, default);

        Assert.True(result);
    }
}
