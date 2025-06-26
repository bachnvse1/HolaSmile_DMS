using System.Security.Claims;
using Application.Interfaces;
using Application.Usecases.Patients.ViewTreatmentProgress;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Patients;

public class ViewTreatmentProgressHandlerTests
{
    private readonly Mock<ITreatmentProgressRepository> _repositoryMock;
    private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
    private readonly Mock<IMapper> _mapperMock;

    private readonly ViewTreatmentProgressHandler _handler;

    public ViewTreatmentProgressHandlerTests()
    {
        _repositoryMock = new Mock<ITreatmentProgressRepository>();
        _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
        _mapperMock = new Mock<IMapper>();

        _handler = new ViewTreatmentProgressHandler(
            _repositoryMock.Object,
            _mapperMock.Object,
            _httpContextAccessorMock.Object
        );
    }

    private void SetupHttpContext(string role, int userId)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var context = new DefaultHttpContext { User = principal };

        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);
    }

    // 🟢 Normal: Patient xem đúng hồ sơ của mình
    [Fact(DisplayName = "[Unit - Normal] Patient_Can_View_Own_Progress")]
    [Trait("TestType", "Normal")]
    public async System.Threading.Tasks.Task N_Patient_Can_View_Own_Progress()
    {
        int treatmentRecordId = 1;
        int userId = 10;
        SetupHttpContext("Patient", userId);

        var progressList = new List<TreatmentProgress>
        {
            new TreatmentProgress
            {
                TreatmentRecordID = treatmentRecordId,
                Patient = new Patient { UserID = userId, User = new User { UserID = userId } },
                Dentist = new global::Dentist { UserId = 2, User = new User { UserID = 2 } }
            }
        };

        _repositoryMock.Setup(r => r.GetByTreatmentRecordIdAsync(treatmentRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(progressList);

        _mapperMock.Setup(m => m.Map<List<ViewTreatmentProgressDto>>(progressList))
            .Returns(new List<ViewTreatmentProgressDto>());

        var result = await _handler.Handle(new ViewTreatmentProgressCommand(treatmentRecordId), default);

        Assert.NotNull(result);
    }

    // 🔵 Abnormal: Patient cố gắng xem hồ sơ người khác
    [Fact(DisplayName = "[Unit - Abnormal] Patient_Cannot_View_Others_Progress")]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task A_Patient_Cannot_View_Others_Progress()
    {
        int treatmentRecordId = 1;
        int userId = 10;
        SetupHttpContext("Patient", userId);

        var progressList = new List<TreatmentProgress>
        {
            new TreatmentProgress
            {
                TreatmentRecordID = treatmentRecordId,
                Patient = new Patient { UserID = 999, User = new User { UserID = 999 } },
                Dentist = new global::Dentist { UserId = 2, User = new User { UserID = 2 } }
            }
        };

        _repositoryMock.Setup(r => r.GetByTreatmentRecordIdAsync(treatmentRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(progressList);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(new ViewTreatmentProgressCommand(treatmentRecordId), default));
    }

    // 🟢 Normal: Assistant có thể xem tất cả hồ sơ
    [Fact(DisplayName = "[Unit - Normal] Assistant_Can_View_All_Progress")]
    [Trait("TestType", "Normal")]
    public async System.Threading.Tasks.Task N_Assistant_Can_View_All_Progress()
    {
        int treatmentRecordId = 1;
        SetupHttpContext("Assistant", 999);

        var progressList = new List<TreatmentProgress>
        {
            new TreatmentProgress
            {
                TreatmentRecordID = treatmentRecordId,
                Patient = new Patient { UserID = 1, User = new User { UserID = 1 } },
                Dentist = new global::Dentist { UserId = 2, User = new User { UserID = 2 } }
            }
        };

        _repositoryMock.Setup(r => r.GetByTreatmentRecordIdAsync(treatmentRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(progressList);

        _mapperMock.Setup(m => m.Map<List<ViewTreatmentProgressDto>>(progressList))
            .Returns(new List<ViewTreatmentProgressDto>());

        var result = await _handler.Handle(new ViewTreatmentProgressCommand(treatmentRecordId), default);

        Assert.NotNull(result);
    }

    // 🔵 Abnormal: Dentist không có liên quan cố gắng xem hồ sơ
    [Fact(DisplayName = "[Unit - Abnormal] Dentist_Cannot_View_Others_Progress")]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task A_Dentist_Cannot_View_Others_Progress()
    {
        int treatmentRecordId = 1;
        int userId = 10;
        SetupHttpContext("Dentist", userId);

        var progressList = new List<TreatmentProgress>
        {
            new TreatmentProgress
            {
                TreatmentRecordID = treatmentRecordId,
                Patient = new Patient { UserID = 1, User = new User { UserID = 1 } },
                Dentist = new global::Dentist { UserId = 999, User = new User { UserID = 999 } }
            }
        };

        _repositoryMock.Setup(r => r.GetByTreatmentRecordIdAsync(treatmentRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(progressList);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(new ViewTreatmentProgressCommand(treatmentRecordId), default));
    }
}
