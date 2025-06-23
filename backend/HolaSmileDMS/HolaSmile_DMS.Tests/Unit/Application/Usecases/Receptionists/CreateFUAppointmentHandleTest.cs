using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Receptionist.CreateFollow_UpAppointment;
using HDMS_API.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Receptionists
{
    public class CreateFUAppointmentHandleTest
    {
        private readonly Mock<IAppointmentRepository> _appointmentRepositoryMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly Mock<IPatientRepository> _patientRepositorymock;
        private readonly Mock<IDentistRepository> _dentistRepositoryMock;

        private readonly CreateFUAppointmentHandle _handler;

        public CreateFUAppointmentHandleTest()
        {
            _appointmentRepositoryMock = new Mock<IAppointmentRepository>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _patientRepositorymock = new Mock<IPatientRepository>();
            _dentistRepositoryMock = new Mock<IDentistRepository>();
            _handler = new CreateFUAppointmentHandle(_appointmentRepositoryMock.Object, _httpContextAccessorMock.Object,_patientRepositorymock.Object, _dentistRepositoryMock.Object);
        }

        private void SetupHttpContext(string? role, int? userId)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            };
            var identity = new ClaimsIdentity(claims, "Test");
            var principal = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = principal };
            _httpContextAccessorMock
                .Setup(x => x.HttpContext)
                .Returns(context);
        }

        [Fact(DisplayName = "[Unit] Unauthorized: User not logged in")]
        public async System.Threading.Tasks.Task UnauthenticatedUser_Returns_MSG26()
        {
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(new DefaultHttpContext { User = new ClaimsPrincipal() });

            var cmd = new CreateFUAppointmentCommand();
            var result = await _handler.Handle(cmd, default);

            Assert.Equal(MessageConstants.MSG.MSG26, result);
        }

        [Fact(DisplayName = "[Unit] Unauthorized: No Role or UserId")]
        public async System.Threading.Tasks.Task MissingClaims_Returns_MSG26()
        {
            SetupHttpContext(null, null); // no role or userId

            var cmd = new CreateFUAppointmentCommand();
            var result = await _handler.Handle(cmd, default);

            Assert.Equal(MessageConstants.MSG.MSG26, result);
        }

        [Theory(DisplayName = "[Unit] Unauthorized: Role not 'receptionist'")]
        [InlineData("Owner")]
        [InlineData("Receptionist")]
        [InlineData("Dentist")]
        public async System.Threading.Tasks.Task NonPatientRole_Returns_MSG26(string role)
        {
            SetupHttpContext(role, 19);

            var cmd = new CreateFUAppointmentCommand();
            var result = await _handler.Handle(cmd, default);

            Assert.Equal(MessageConstants.MSG.MSG26, result);
        }

        [Fact(DisplayName = "[Unit] Receptionist Creates Appointment Successfully")]
        public async System.Threading.Tasks.Task Receptionist_Successfully_Creates_Appointment()
        {
            SetupHttpContext("Receptionist", 18);

            _appointmentRepositoryMock
                .Setup(r => r.CreateAppointmentAsync(It.IsAny<Appointment>()))
                .ReturnsAsync(true);

            var cmd = new CreateFUAppointmentCommand
            {
                PatientId = 1,
                DentistId = 2,
                ReasonForFollowUp = "Follow-up for tooth extraction",
                AppointmentDate = DateTime.Today.AddDays(2),
                AppointmentTime = TimeSpan.FromHours(10)
            };

            var result = await _handler.Handle(cmd, default);
            Assert.Equal(MessageConstants.MSG.MSG05, result);
        }

        [Fact(DisplayName = "[Unit] AppointmentDate_Must_Be_After_Today")]
        public async System.Threading.Tasks.Task AppointmentDate_Must_Be_After_Today()
        {
            SetupHttpContext("receptionist", 18);

            var cmd = new CreateFUAppointmentCommand
            {
                PatientId = 1,
                DentistId = 2,
                ReasonForFollowUp = "Follow-up check",
                AppointmentDate = DateTime.Today.AddDays(-1), // Ngày hiện tại (không hợp lệ)
                AppointmentTime = TimeSpan.FromHours(10)
            };

            var result = await _handler.Handle(cmd, default);

            Assert.Equal(MessageConstants.MSG.MSG57, result);
        }

        // dentist not exist
        [Fact(DisplayName = "[Unit] Bác sĩ không tồn tại")]
        public async System.Threading.Tasks.Task Dentist_Not_Exist()
        {
            SetupHttpContext("Receptionist", 18);

            _dentistRepositoryMock.Setup(x => x.GetDentistByUserIdAsync(It.IsAny<int>()))
                .ReturnsAsync((Dentist)null);

            var cmd = new CreateFUAppointmentCommand
            {
                PatientId = 1,
                DentistId = 999,
                AppointmentDate = DateTime.Today.AddDays(1),
                AppointmentTime = TimeSpan.FromHours(10),
                ReasonForFollowUp = "Check"
            };

            var result = await _handler.Handle(cmd, CancellationToken.None);

            Assert.Equal("Bác sĩ không tồn tại", result);
        }

        [Fact(DisplayName = "[Unit] Bệnh nhân không tồn tại")]
        public async System.Threading.Tasks.Task Patient_Not_Exist()
        {
            SetupHttpContext("Receptionist", 18);

            _dentistRepositoryMock.Setup(x => x.GetDentistByUserIdAsync(It.IsAny<int>()))
                .ReturnsAsync(new Dentist());

            _patientRepositorymock.Setup(x => x.GetPatientByIdAsync(It.IsAny<int>()))
                .ReturnsAsync((Patient)null);

            var cmd = new CreateFUAppointmentCommand
            {
                PatientId = 999,
                DentistId = 2,
                AppointmentDate = DateTime.Today.AddDays(1),
                AppointmentTime = TimeSpan.FromHours(10),
                ReasonForFollowUp = "Check"
            };
            var result = await _handler.Handle(cmd, CancellationToken.None);

            Assert.Equal("Bệnh nhân không tồn tại", result);
        }
    }
}
