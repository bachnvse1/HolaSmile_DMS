using System.Security.Claims;
using Application.Interfaces;
using Application.Usecases.Patients.ViewTreatmentRecord;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Patients;

public class ViewPatientTreatmentRecordHandlerTests
{
    private readonly Mock<ITreatmentRecordRepository> _repositoryMock;
    private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
    private readonly ViewPatientTreatmentRecordHandler _handler;

    public ViewPatientTreatmentRecordHandlerTests()
    {
        _repositoryMock = new Mock<ITreatmentRecordRepository>();
        _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
        _handler = new ViewPatientTreatmentRecordHandler(_repositoryMock.Object, _httpContextAccessorMock.Object);
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

    // 🟢 Normal - UTCID01 - Patient xem đúng hồ sơ của mình
    [Fact(DisplayName = "Normal - UTCID01 - Patient can view their own treatment records")]
    public async System.Threading.Tasks.Task UTCID01_Patient_Can_View_Own_Records()
    {
        int userId = 5;
        SetupHttpContext("Patient", userId);

        var dummyRecords = new List<ViewTreatmentRecordDto>
        {
            new() { TreatmentRecordID = 1, AppointmentID = 100 }
        };

        _repositoryMock.Setup(r => r.GetPatientTreatmentRecordsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(dummyRecords);

        var result = await _handler.Handle(new ViewTreatmentRecordsCommand(userId), default);

        Assert.NotNull(result);
        Assert.Single(result);
    }

    // 🔵 Abnormal - UTCID02 - Patient cố gắng xem hồ sơ người khác
    [Fact(DisplayName = "Abnormal - UTCID02 - Patient cannot view other patient's treatment records")]
    public async System.Threading.Tasks.Task UTCID02_Patient_Cannot_View_Others_Records()
    {
        SetupHttpContext("Patient", 5); // đang login userId = 5
        var request = new ViewTreatmentRecordsCommand(99); // yêu cầu xem của userId = 99

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(request, default));
    }

    // 🟢 Normal - UTCID03 - Dentist có thể xem hồ sơ của bất kỳ bệnh nhân nào
    [Fact(DisplayName = "Normal - UTCID03 - Dentist can view any patient treatment records")]
    public async System.Threading.Tasks.Task UTCID03_Dentist_Can_View_Any_Patient_Records()
    {
        SetupHttpContext("Dentist", 99);
        var patientId = 5;

        var dummyRecords = new List<ViewTreatmentRecordDto>
        {
            new() { TreatmentRecordID = 1, AppointmentID = 100 }
        };

        _repositoryMock.Setup(r => r.GetPatientTreatmentRecordsAsync(patientId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(dummyRecords);

        var result = await _handler.Handle(new ViewTreatmentRecordsCommand(patientId), default);

        Assert.NotNull(result);
        Assert.Single(result);
    }

    // 🔵 Abnormal - UTCID04 - Không có hồ sơ nào được tìm thấy
    [Fact(DisplayName = "Abnormal - UTCID04 - No treatment records found for valid access")]
    public async System.Threading.Tasks.Task UTCID04_No_Treatment_Records_Found()
    {
        int userId = 5;
        SetupHttpContext("Patient", userId);

        _repositoryMock.Setup(r => r.GetPatientTreatmentRecordsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ViewTreatmentRecordDto>());

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _handler.Handle(new ViewTreatmentRecordsCommand(userId), default));
    }

    // 🔵 Abnormal - UTCID05 - Unauthorized role (Assistant) không có quyền
    [Fact(DisplayName = "Abnormal - UTCID05 - Unauthorized role (Assistant) cannot access")]
    public async System.Threading.Tasks.Task UTCID05_Assistant_Cannot_Access()
    {
        SetupHttpContext("Assistant", 3);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(new ViewTreatmentRecordsCommand(5), default));
    }

    // 🔵 Abnormal - UTCID06 - Không có User trong HttpContext
    [Fact(DisplayName = "Abnormal - UTCID06 - No user in HttpContext")]
    public async System.Threading.Tasks.Task UTCID06_NoUserInHttpContext_ThrowsException()
    {
        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns((HttpContext?)null);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(new ViewTreatmentRecordsCommand(5), default));
    }

    // 🔵 Abnormal - UTCID07 - Role null hoặc không có Claim
    [Fact(DisplayName = "Abnormal - UTCID07 - Missing role or identifier claims")]
    public async System.Threading.Tasks.Task UTCID07_MissingClaims_ThrowsException()
    {
        var identity = new ClaimsIdentity(); // không có claim
        var principal = new ClaimsPrincipal(identity);
        var context = new DefaultHttpContext { User = principal };

        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(new ViewTreatmentRecordsCommand(5), default));
    }

    // 🔵 Abnormal - UTCID08 - Dữ liệu từ repository trả về null
    [Fact(DisplayName = "Abnormal - UTCID08 - Repository returns null")]
    public async System.Threading.Tasks.Task UTCID08_Repository_Returns_Null()
    {
        int userId = 5;
        SetupHttpContext("Patient", userId);

        _repositoryMock.Setup(r => r.GetPatientTreatmentRecordsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((List<ViewTreatmentRecordDto>?)null);

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _handler.Handle(new ViewTreatmentRecordsCommand(userId), default));
    }
}
