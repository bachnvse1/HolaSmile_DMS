using System.Security.Claims;
using Application.Usecases.UserCommon.ViewAppointment;
using AutoMapper;
using HDMS_API.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.UserCommon
{
    public class ViewAppoinntmentHandlerTest
    {
        private readonly Mock<IAppointmentRepository> _appointmentRepositoryMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly ViewAppointmentHandler _handler;

        public ViewAppoinntmentHandlerTest()
        {
            _appointmentRepositoryMock = new Mock<IAppointmentRepository>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _mapperMock = new Mock<IMapper>();

            // Initialize the handler with the mocked dependencies
            _handler = new ViewAppointmentHandler(
                _appointmentRepositoryMock.Object,
                _httpContextAccessorMock.Object,
                _mapperMock.Object
            );
        }
        // Add your test methods here

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
            _httpContextAccessorMock
                .Setup(x => x.HttpContext)
                .Returns(context);
        }

        // 🟢 Abnormal: Unauthenticated user cann't view all appointments
        [Fact(DisplayName = "[Unit - Abnormal] Unauthenticated_Throws_UnauthorizedAccessException")]
        public async System.Threading.Tasks.Task A_Unauthenticated_Throws_UnauthorizedAccessException()
        {
            // No role claim => unauthorized
            var emptyContext = new DefaultHttpContext { User = new ClaimsPrincipal() };
            _httpContextAccessorMock
                .Setup(x => x.HttpContext)
                .Returns(emptyContext);

            await Assert.ThrowsAsync<UnauthorizedAccessException>(
                () => _handler.Handle(new ViewAppointmentCommand(), CancellationToken.None)
            );
        }

        // 🟢 Normal: Patient can view their own appointments
        [Fact(DisplayName = "[Unit - Normal] Patient_Can_View_Own_Appointments")]
        public async System.Threading.Tasks.Task N_Patient_Can_View_Own_Appointments()
        {
            int userId = 5;
            SetupHttpContext("patient", userId);

            var appointments = new List<Appointment>
            {
                new Appointment { PatientId = userId }
            };
            _appointmentRepositoryMock
                .Setup(r => r.GetAppointmentsByPatientIdAsync(userId))
                .ReturnsAsync(appointments);

            _mapperMock
                .Setup(m => m.Map<List<AppointmentDTO>>(appointments))
                .Returns(new List<AppointmentDTO>());

            var result = await _handler.Handle(new ViewAppointmentCommand(), CancellationToken.None);
            Assert.NotNull(result);
        }

        [Fact(DisplayName = "[Unit - Normal] Dentist_Can_View_Own_Appointments")]
        public async System.Threading.Tasks.Task N_Dentist_Can_View_Own_Appointments()
        {
            int userId = 17;
            SetupHttpContext("dentist", userId);

            var appointments = new List<Appointment>
            {
                new Appointment { DentistId = userId }
            };
            _appointmentRepositoryMock
                .Setup(r => r.GetAppointmentsByDentistIdAsync(userId))
                .ReturnsAsync(appointments);

            _mapperMock
                .Setup(m => m.Map<List<AppointmentDTO>>(appointments))
                .Returns(new List<AppointmentDTO>());

            var result = await _handler.Handle(new ViewAppointmentCommand(), CancellationToken.None);
            Assert.NotNull(result);
        }

        [Fact(DisplayName = "[Unit - Normal] OtherRole_Can_View_All_Appointments")]
        public async System.Threading.Tasks.Task N_OtherRole_Can_View_All_Appointments()
        {
            SetupHttpContext("Receptionist", 18);

            var appointments = new List<Appointment> { new Appointment() };
            _appointmentRepositoryMock
                .Setup(r => r.GetAllAppointmentAsync())
                .ReturnsAsync(appointments);

            _mapperMock
                .Setup(m => m.Map<List<AppointmentDTO>>(appointments))
                .Returns(new List<AppointmentDTO>());

            var result = await _handler.Handle(new ViewAppointmentCommand(), CancellationToken.None);
            Assert.NotNull(result);
        }

        [Fact(DisplayName = "[Unit - Abnormal] Repository_Returns_Null_Throws_Exception")]
        public async System.Threading.Tasks.Task A_RepositoryReturnsNull_Throws_Exception()
        {
            SetupHttpContext("Receptionist", 18);
            _appointmentRepositoryMock
                .Setup(r => r.GetAllAppointmentAsync())
                .ReturnsAsync((List<Appointment>)null);

            await Assert.ThrowsAsync<Exception>(
                () => _handler.Handle(new ViewAppointmentCommand(), CancellationToken.None)
            );
        }


    }
}
