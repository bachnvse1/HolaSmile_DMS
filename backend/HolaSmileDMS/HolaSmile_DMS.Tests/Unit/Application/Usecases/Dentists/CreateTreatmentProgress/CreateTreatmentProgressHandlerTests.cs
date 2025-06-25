using System.Security.Claims;
using Application.Constants;
using Application.Constants.Interfaces;
using Application.Usecases.Dentist.CreateTreatmentProcess;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Dentists.CreateTreatmentProgress;

public class CreateTreatmentProgressHandlerTests
{
    private CreateTreatmentProgressCommand GetValidCommand() => new()
    {
        ProgressDto = new CreateTreatmentProgressDto
        {
            TreatmentRecordID = 1,
            PatientID = 2,
            ProgressName = "Tiến trình 1",
            ProgressContent = "Nội dung",
            Status = "InProgress",
            Duration = 30,
            Description = "Chi tiết",
            EndTime = DateTime.UtcNow.AddHours(1),
            Note = "Ghi chú"
        }
    };

    private (CreateTreatmentProgressHandler Handler, Mock<ITreatmentProgressRepository> RepoMock, Mock<IDentistRepository> DentistRepoMock)
    SetupHandler(string role, int userId, CreateTreatmentProgressCommand command)
    {
        var repoMock = new Mock<ITreatmentProgressRepository>();
        var dentistRepoMock = new Mock<IDentistRepository>();
        var mapperMock = new Mock<IMapper>();
        var httpMock = new Mock<IHttpContextAccessor>();

        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role)
        }));

        httpMock.Setup(h => h.HttpContext!.User).Returns(user);

        mapperMock.Setup(m => m.Map<TreatmentProgress>(It.IsAny<CreateTreatmentProgressDto>()))
            .Returns(new TreatmentProgress
            {
                TreatmentRecordID = command.ProgressDto.TreatmentRecordID,
                PatientID = command.ProgressDto.PatientID,
                ProgressName = command.ProgressDto.ProgressName,
                Duration = command.ProgressDto.Duration,
                EndTime = command.ProgressDto.EndTime
            });

        return (
            new CreateTreatmentProgressHandler(repoMock.Object, httpMock.Object, mapperMock.Object, dentistRepoMock.Object),
            repoMock,
            dentistRepoMock
        );
    }

    [Fact(DisplayName = "Normal - UTCID01 - Valid input should return success")]
    public async System.Threading.Tasks.Task UTCID01_ValidInput_ShouldReturnSuccess()
    {
        var cmd = GetValidCommand();

        var repoMock = new Mock<ITreatmentProgressRepository>();
        var dentistRepoMock = new Mock<IDentistRepository>();
        var mapperMock = new Mock<IMapper>();
        var httpMock = new Mock<IHttpContextAccessor>();

        // Mock HttpContext với role Dentist
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim(ClaimTypes.Role, "Dentist")
        }));
        httpMock.Setup(h => h.HttpContext!.User).Returns(user);

        // Mock Mapper
        mapperMock.Setup(m => m.Map<TreatmentProgress>(It.IsAny<CreateTreatmentProgressDto>()))
            .Returns(new TreatmentProgress
            {
                TreatmentRecordID = cmd.ProgressDto.TreatmentRecordID,
                PatientID = cmd.ProgressDto.PatientID,
                ProgressName = cmd.ProgressDto.ProgressName,
                Duration = cmd.ProgressDto.Duration,
                EndTime = cmd.ProgressDto.EndTime
            });
        
        dentistRepoMock
            .Setup(r => r.GetDentistByUserIdAsync(1))
            .ReturnsAsync(new Dentist { DentistId = 100 });

        var handler = new CreateTreatmentProgressHandler(
            repoMock.Object,
            httpMock.Object,
            mapperMock.Object,
            dentistRepoMock.Object);

        var result = await handler.Handle(cmd, default);

        Assert.Equal(MessageConstants.MSG.MSG37, result);
    }

    [Fact(DisplayName = "Abnormal - UTCID02 - Role is not Dentist should throw Unauthorized")]
    public async System.Threading.Tasks.Task UTCID02_RoleIsNotDentist_ShouldThrow()
    {
        var cmd = GetValidCommand();
        var (handler, _, _) = SetupHandler("Patient", 2, cmd);
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(cmd, default));
    }

    [Fact(DisplayName = "Abnormal - UTCID03 - HttpContext is null should throw Unauthorized")]
    public async System.Threading.Tasks.Task UTCID03_HttpContextIsNull_ShouldThrow()
    {
        var cmd = GetValidCommand();

        var repoMock = new Mock<ITreatmentProgressRepository>();
        var dentistRepoMock = new Mock<IDentistRepository>();
        var mapperMock = new Mock<IMapper>();
        var httpMock = new Mock<IHttpContextAccessor>();
        httpMock.Setup(h => h.HttpContext).Returns((HttpContext)null!);

        var handler = new CreateTreatmentProgressHandler(repoMock.Object, httpMock.Object, mapperMock.Object, dentistRepoMock.Object);
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(cmd, default));
    }

    [Fact(DisplayName = "Abnormal - UTCID04 - TreatmentRecordID = 0 should throw MSG07")]
    public async System.Threading.Tasks.Task UTCID04_TreatmentRecordIDIsZero_ShouldThrow()
    {
        var cmd = GetValidCommand();
        cmd.ProgressDto.TreatmentRecordID = 0;
        var (handler, _, _) = SetupHandler("Dentist", 1, cmd);
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => handler.Handle(cmd, default));
        Assert.Contains(MessageConstants.MSG.MSG07, ex.Message);
    }

    [Fact(DisplayName = "Abnormal - UTCID05 - PatientID = 0 should throw MSG07")]
    public async System.Threading.Tasks.Task UTCID05_PatientIDIsZero_ShouldThrow()
    {
        var cmd = GetValidCommand();
        cmd.ProgressDto.PatientID = 0;
        var (handler, _, _) = SetupHandler("Dentist", 1, cmd);
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => handler.Handle(cmd, default));
        Assert.Contains(MessageConstants.MSG.MSG07, ex.Message);
    }

    [Fact(DisplayName = "Abnormal - UTCID06 - ProgressName is null should throw")]
    public async System.Threading.Tasks.Task UTCID06_ProgressNameIsNull_ShouldThrow()
    {
        var cmd = GetValidCommand();
        cmd.ProgressDto.ProgressName = null;
        var (handler, _, _) = SetupHandler("Dentist", 1, cmd);
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => handler.Handle(cmd, default));
        Assert.Contains("Tên tiến trình không được để trống", ex.Message);
    }

    [Fact(DisplayName = "Abnormal - UTCID07 - Duration <= 0 should throw")]
    public async System.Threading.Tasks.Task UTCID07_DurationIsZero_ShouldThrow()
    {
        var cmd = GetValidCommand();
        cmd.ProgressDto.Duration = 0;
        var (handler, _, _) = SetupHandler("Dentist", 1, cmd);
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => handler.Handle(cmd, default));
        Assert.Contains("Thời lượng phải lớn hơn 0", ex.Message);
    }

    [Fact(DisplayName = "Abnormal - UTCID08 - EndTime is in the past should throw MSG76")]
    public async System.Threading.Tasks.Task UTCID08_EndTimeInPast_ShouldThrow()
    {
        var cmd = GetValidCommand();
        cmd.ProgressDto.EndTime = DateTime.UtcNow.AddMinutes(-10);
        var (handler, _, _) = SetupHandler("Dentist", 1, cmd);
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => handler.Handle(cmd, default));
        Assert.Contains(MessageConstants.MSG.MSG84, ex.Message);
    }

    [Fact(DisplayName = "Abnormal - UTCID09 - Status too long (>255) should throw")]
    public async System.Threading.Tasks.Task UTCID09_StatusTooLong_ShouldThrow()
    {
        var cmd = GetValidCommand();
        cmd.ProgressDto.Status = new string('x', 256);
        var (handler, _, _) = SetupHandler("Dentist", 1, cmd);
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => handler.Handle(cmd, default));
        Assert.Contains("Trạng thái không được vượt quá 255 ký tự", ex.Message);
    }

    [Fact(DisplayName = "Abnormal - UTCID10 - Duplicate progress in same day should throw MSG36")]
    public async System.Threading.Tasks.Task UTCID10_DuplicateSameDay_ShouldThrow()
    {
        var cmd = GetValidCommand();

        var repoMock = new Mock<ITreatmentProgressRepository>();
        repoMock.Setup(r => r.CreateAsync(It.IsAny<TreatmentProgress>()))
                .ThrowsAsync(new Exception(MessageConstants.MSG.MSG36)); // giả lập lỗi trùng

        var dentistRepoMock = new Mock<IDentistRepository>();
        var mapperMock = new Mock<IMapper>();
        mapperMock.Setup(m => m.Map<TreatmentProgress>(It.IsAny<CreateTreatmentProgressDto>()))
            .Returns(new TreatmentProgress
            {
                TreatmentRecordID = cmd.ProgressDto.TreatmentRecordID,
                PatientID = cmd.ProgressDto.PatientID,
                ProgressName = cmd.ProgressDto.ProgressName,
                Duration = cmd.ProgressDto.Duration,
                EndTime = cmd.ProgressDto.EndTime
            });

        var httpMock = new Mock<IHttpContextAccessor>();
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim(ClaimTypes.Role, "Dentist")
        }));
        httpMock.Setup(h => h.HttpContext!.User).Returns(user);
        dentistRepoMock
            .Setup(r => r.GetDentistByUserIdAsync(1))
            .ReturnsAsync(new Dentist { DentistId = 100 });
        var handler = new CreateTreatmentProgressHandler(repoMock.Object, httpMock.Object, mapperMock.Object, dentistRepoMock.Object);

        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(cmd, default));
        Assert.Contains(MessageConstants.MSG.MSG36, ex.Message);
    }
}