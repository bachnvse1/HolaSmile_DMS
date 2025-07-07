using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Receptionist.CreateFollow_UpAppointment;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Receptionists;
public class CreateFUAppointmentHandlerTests
{
    private readonly Mock<IAppointmentRepository> _appointmentRepositoryMock = new();
    private readonly Mock<IPatientRepository> _patientRepositoryMock = new();
    private readonly Mock<IDentistRepository> _dentistRepositoryMock = new();
    private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();

    private readonly CreateFUAppointmentHandle _handler;

    public CreateFUAppointmentHandlerTests()
    {
        _handler = new CreateFUAppointmentHandle(
            _appointmentRepositoryMock.Object,
            _httpContextAccessorMock.Object,
            _patientRepositoryMock.Object,
            _dentistRepositoryMock.Object
        );
    }

    private void SetupHttpContext(string role, int userId)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.Role, role),
            new(ClaimTypes.NameIdentifier, userId.ToString())
        };
        var identity = new ClaimsIdentity(claims, "test");
        var context = new DefaultHttpContext { User = new ClaimsPrincipal(identity) };
        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);
    }

    [Fact(DisplayName = "[Unit - Abnormal] Unauthorized role returns error")]
    public async System.Threading.Tasks.Task UnauthorizedRole_ReturnsError()
    {
        SetupHttpContext("patient", 1);
        var cmd = new CreateFUAppointmentCommand();

        var result = await _handler.Handle(cmd, default);
        Assert.Equal(MessageConstants.MSG.MSG26, result);
    }

    [Fact(DisplayName = "[Unit - Abnormal] Appointment date in past")]
    public async System.Threading.Tasks.Task AppointmentDateInPast_ReturnsError()
    {
        SetupHttpContext("receptionist", 1);
        var cmd = new CreateFUAppointmentCommand { AppointmentDate = DateTime.Today.AddDays(-1) };

        var result = await _handler.Handle(cmd, default);
        Assert.Equal(MessageConstants.MSG.MSG34, result);
    }

    [Fact(DisplayName = "[Unit - Abnormal] Dentist not exists")]
    public async System.Threading.Tasks.Task DentistNotFound_ReturnsError()
    {
        SetupHttpContext("receptionist", 1);
        var cmd = new CreateFUAppointmentCommand
        {
            AppointmentDate = DateTime.Today.AddDays(1),
            DentistId = 1
        };
        _dentistRepositoryMock.Setup(x => x.GetDentistByDentistIdAsync(1)).ReturnsAsync((Dentist)null);

        var result = await _handler.Handle(cmd, default);
        Assert.Equal("Bác sĩ không tồn tại", result);
    }

    [Fact(DisplayName = "[Unit - Abnormal] Patient not exists")]
    public async System.Threading.Tasks.Task PatientNotFound_ReturnsError()
    {
        SetupHttpContext("receptionist", 1);
        var cmd = new CreateFUAppointmentCommand
        {
            AppointmentDate = DateTime.Today.AddDays(1),
            DentistId = 1,
            PatientId = 2
        };
        _dentistRepositoryMock.Setup(x => x.GetDentistByDentistIdAsync(1)).ReturnsAsync(new Dentist());
        _patientRepositoryMock.Setup(x => x.GetPatientByUserIdAsync(2)).ReturnsAsync((Patient)null);

        var result = await _handler.Handle(cmd, default);
        Assert.Equal("Bệnh nhân không tồn tại", result);
    }

    [Fact(DisplayName = "[Unit - Abnormal] Existing confirmed appointment")]
    public async System.Threading.Tasks.Task ExistingConfirmedAppointment_Throws()
    {
        SetupHttpContext("receptionist", 1);
        var cmd = new CreateFUAppointmentCommand
        {
            AppointmentDate = DateTime.Today.AddDays(1),
            DentistId = 1,
            PatientId = 2
        };
        _dentistRepositoryMock.Setup(x => x.GetDentistByDentistIdAsync(1)).ReturnsAsync(new Dentist());
        _patientRepositoryMock.Setup(x => x.GetPatientByUserIdAsync(2)).ReturnsAsync(new Patient());
        _appointmentRepositoryMock.Setup(x => x.GetLatestAppointmentByPatientIdAsync(2))
            .ReturnsAsync(new Appointment { Status = "confirmed" });

        await Assert.ThrowsAsync<Exception>(() => _handler.Handle(cmd, default));
    }

    [Fact(DisplayName = "[Unit - Normal] Create follow-up appointment success")]
    public async System.Threading.Tasks.Task CreateFollowUpAppointment_Success()
    {
        SetupHttpContext("receptionist", 1);
        var cmd = new CreateFUAppointmentCommand
        {
            AppointmentDate = DateTime.Today.AddDays(1),
            DentistId = 1,
            PatientId = 2,
            AppointmentTime = new TimeSpan(14, 0, 0),
            ReasonForFollowUp = "Checkup"
        };
        _dentistRepositoryMock.Setup(x => x.GetDentistByDentistIdAsync(1)).ReturnsAsync(new Dentist());
        _patientRepositoryMock.Setup(x => x.GetPatientByUserIdAsync(2)).ReturnsAsync(new Patient());
        _appointmentRepositoryMock.Setup(x => x.GetLatestAppointmentByPatientIdAsync(2))
            .ReturnsAsync(new Appointment { Status = "pending" });
        _appointmentRepositoryMock.Setup(x => x.CreateAppointmentAsync(It.IsAny<Appointment>())).ReturnsAsync(true);

        var result = await _handler.Handle(cmd, default);

        Assert.Equal(MessageConstants.MSG.MSG05, result);
    }
}
