using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Receptionist.CreateFUAppointment;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Receptionists
{
    public class CreateFUAppointmentHandleTests
{
    private readonly Mock<IAppointmentRepository> _appointmentRepoMock;
    private readonly Mock<IPatientRepository> _patientRepoMock;
    private readonly Mock<IDentistRepository> _dentistRepoMock;
    private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
    private readonly Mock<IMediator> _mediatorMock;
    private readonly CreateFUAppointmentHandle _handler;

    public CreateFUAppointmentHandleTests()
    {
        _appointmentRepoMock = new Mock<IAppointmentRepository>();
        _patientRepoMock = new Mock<IPatientRepository>();
        _dentistRepoMock = new Mock<IDentistRepository>();
        _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
        _mediatorMock = new Mock<IMediator>();
        _handler = new CreateFUAppointmentHandle(
            _appointmentRepoMock.Object,
            _httpContextAccessorMock.Object,
            _patientRepoMock.Object,
            _dentistRepoMock.Object,
            _mediatorMock.Object
            );
    }

    private void SetupHttpContext(string role, int userId)
    {
        var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var user = new ClaimsPrincipal(identity);
        var context = new DefaultHttpContext { User = user };
        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);
    }

    // 🔵 Normal - UTCID01 - Success
    [Fact(DisplayName = "UTCID01 - Normal - Create follow-up appointment successfully")]
    public async System.Threading.Tasks.Task UTCID01_CreateAppointment_Success()
    {
        // Arrange
        SetupHttpContext("receptionist", 10);
        var command = new CreateFUAppointmentCommand
        {
            PatientId = 1,
            DentistId = 2,
            AppointmentDate = DateTime.Today.AddDays(1),
            AppointmentTime = new TimeSpan(13, 0, 0),
            ReasonForFollowUp = "Tái khám răng số 7"
        };

        _dentistRepoMock.Setup(r => r.GetDentistByDentistIdAsync(2)).ReturnsAsync(new Dentist());
        _patientRepoMock.Setup(r => r.GetPatientByPatientIdAsync(1)).ReturnsAsync(new Patient());
        _appointmentRepoMock.Setup(r => r.GetLatestAppointmentByPatientIdAsync(1))
            .ReturnsAsync(new Appointment { Status = "done" });
        _appointmentRepoMock.Setup(r => r.CreateAppointmentAsync(It.IsAny<Appointment>())).ReturnsAsync(true);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.Equal(MessageConstants.MSG.MSG05, result);
    }

    // 🔴 UTCID02 - Không phải receptionist
    [Fact(DisplayName = "UTCID02 - Abnormal - Role không phải receptionist")]
    public async System.Threading.Tasks.Task UTCID02_InvalidRole_ThrowsUnauthorized()
    {
        SetupHttpContext("patient", 5);
        var cmd = new CreateFUAppointmentCommand();

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(cmd, CancellationToken.None));

        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }

    // 🔴 UTCID03 - Ngày hẹn trước hôm nay
    [Fact(DisplayName = "UTCID03 - Abnormal - Appointment date in the past")]
    public async System.Threading.Tasks.Task UTCID03_PastDate_ThrowsException()
    {
        SetupHttpContext("receptionist", 5);

        var command = new CreateFUAppointmentCommand
        {
            AppointmentDate = DateTime.Today.AddDays(-1),
            AppointmentTime = new TimeSpan(9, 0, 0)
        };

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            _handler.Handle(command, CancellationToken.None));

        Assert.Equal(MessageConstants.MSG.MSG34, ex.Message);
    }

    // 🔴 UTCID04 - Hẹn hôm nay nhưng giờ quá khứ
    [Fact(DisplayName = "UTCID04 - Abnormal - Appointment today but time in the past")]
    public async System.Threading.Tasks.Task UTCID04_TodayButTimePast_ThrowsException()
    {
        SetupHttpContext("receptionist", 5);

        var command = new CreateFUAppointmentCommand
        {
            AppointmentDate = DateTime.Today,
            AppointmentTime = DateTime.Now.TimeOfDay.Subtract(TimeSpan.FromMinutes(10))
        };

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            _handler.Handle(command, CancellationToken.None));

        Assert.Equal(MessageConstants.MSG.MSG34, ex.Message);
    }

    // 🔴 UTCID05 - Dentist không tồn tại
    [Fact(DisplayName = "UTCID05 - Abnormal - Dentist not found")]
    public async System.Threading.Tasks.Task UTCID05_DentistNotFound_ThrowsException()
    {
        SetupHttpContext("receptionist", 5);

        var command = new CreateFUAppointmentCommand
        {
            AppointmentDate = DateTime.Today.AddDays(1),
            AppointmentTime = new TimeSpan(10, 0, 0),
            DentistId = 99
        };

        _dentistRepoMock.Setup(r => r.GetDentistByDentistIdAsync(99)).ReturnsAsync((Dentist)null);

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            _handler.Handle(command, CancellationToken.None));

        Assert.Equal("Bác sĩ không tồn tại", ex.Message);
    }

    // 🔴 UTCID06 - Patient không tồn tại
    [Fact(DisplayName = "UTCID06 - Abnormal - Patient not found")]
    public async System.Threading.Tasks.Task UTCID06_PatientNotFound_ThrowsException()
    {
        SetupHttpContext("receptionist", 5);

        var command = new CreateFUAppointmentCommand
        {
            AppointmentDate = DateTime.Today.AddDays(1),
            AppointmentTime = new TimeSpan(10, 0, 0),
            DentistId = 1,
            PatientId = 100
        };

        _dentistRepoMock.Setup(r => r.GetDentistByDentistIdAsync(1)).ReturnsAsync(new Dentist());
        _patientRepoMock.Setup(r => r.GetPatientByPatientIdAsync(100)).ReturnsAsync((Patient)null);

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            _handler.Handle(command, CancellationToken.None));

        Assert.Equal("Bệnh nhân không tồn tại", ex.Message);
    }

    // 🔴 UTCID07 - Lịch gần nhất của bệnh nhân đang confirmed
    [Fact(DisplayName = "UTCID07 - Abnormal - Latest appointment already confirmed")]
    public async System.Threading.Tasks.Task UTCID07_AlreadyConfirmedAppointment_ThrowsException()
    {
        SetupHttpContext("receptionist", 5);

        var command = new CreateFUAppointmentCommand
        {
            AppointmentDate = DateTime.Today.AddDays(1),
            AppointmentTime = new TimeSpan(10, 0, 0),
            DentistId = 1,
            PatientId = 2
        };

        _dentistRepoMock.Setup(r => r.GetDentistByDentistIdAsync(1)).ReturnsAsync(new Dentist());
        _patientRepoMock.Setup(r => r.GetPatientByPatientIdAsync(2)).ReturnsAsync(new Patient());
        _appointmentRepoMock.Setup(r => r.GetLatestAppointmentByPatientIdAsync(2))
            .ReturnsAsync(new Appointment { Status = "confirmed" });

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            _handler.Handle(command, CancellationToken.None));

        Assert.Equal(MessageConstants.MSG.MSG89, ex.Message);
    }
}
}
