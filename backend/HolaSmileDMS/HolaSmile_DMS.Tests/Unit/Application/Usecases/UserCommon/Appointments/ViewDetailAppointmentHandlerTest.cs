using System.Security.Claims;
using Application.Usecases.UserCommon.ViewAppointment;
using AutoMapper;
using HDMS_API.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.UserCommon
{
    public class ViewDetailAppointmentHandlerTest
    {
        private readonly Mock<IAppointmentRepository> _appointmentRepoMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly ViewDetailAppointmentHandler _handler;

        public ViewDetailAppointmentHandlerTest()
        {
            _appointmentRepoMock = new Mock<IAppointmentRepository>();
            _mapperMock = new Mock<IMapper>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();

            _handler = new ViewDetailAppointmentHandler(
                _appointmentRepoMock.Object,
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
            var ctx = new DefaultHttpContext { User = principal };
            _httpContextAccessorMock
                .Setup(x => x.HttpContext)
                .Returns(ctx);
        }

        // 🟢 AbNormal: Author user
        [Fact(DisplayName = "[Unit] Unauthenticated_ThrowsUnauthorized")]
        public async System.Threading.Tasks.Task Unauthenticated_ThrowsUnauthorized()
        {
            var emptyContext = new DefaultHttpContext { User = new ClaimsPrincipal() };
            _httpContextAccessorMock
                .Setup(x => x.HttpContext)
                .Returns(emptyContext);

            await Assert.ThrowsAsync<UnauthorizedAccessException>(
                () => _handler.Handle(new ViewDetailAppointmentCommand(12), CancellationToken.None)
            );
        }

        // 🟢 Normal: Patient view own appointment
        [Fact(DisplayName = "[Unit] Patient_Can_View_Own_Appointment")]
        public async System.Threading.Tasks.Task Patient_Can_View_Own_Appointment()
        {
            int appointmentId = 13;
            int userId = 12;
            SetupHttpContext("patient", userId);

            // repository says appointment belongs to patient
            _appointmentRepoMock
                .Setup(r => r.CheckPatientAppointmentByUserIdAsync(appointmentId, userId))
                .ReturnsAsync(true);

            // repository returns an Appointment entity
            var appointment = new Appointment
            {
                AppointmentId = appointmentId,
                // ...fill other properties if needed
            };
            _appointmentRepoMock
                .Setup(r => r.GetAppointmentByIdAsync(appointmentId))
                .ReturnsAsync(appointment);

            // mapper returns a DTO without AppointmentId set
            var dto = new AppointmentDTO { /* other fields */ };
            _mapperMock
                .Setup(m => m.Map<AppointmentDTO>(appointment))
                .Returns(dto);

            var result = await _handler.Handle(
                new ViewDetailAppointmentCommand(appointmentId),
                CancellationToken.None);

            Assert.NotNull(result);
            Assert.Equal(appointmentId, result.AppointmentId);
        }

        // 🟢 AbNormal: Patient cannot view others' appointment
        [Fact(DisplayName = "[Unit] Patient_Cannot_View_Others_Appointment")]
        public async System.Threading.Tasks.Task Patient_Cannot_View_Others_Appointment()
        {
            int appointmentId = 13;
            int userId = 15;
            SetupHttpContext("patient", userId);

            // repository says appointment NOT belong to patient
            _appointmentRepoMock
                .Setup(r => r.CheckPatientAppointmentByUserIdAsync(appointmentId, userId))
                .ReturnsAsync(false);

            await Assert.ThrowsAsync<Exception>(async () =>
                await _handler.Handle(
                    new ViewDetailAppointmentCommand(appointmentId),
                    CancellationToken.None)
            );
        }

        // 🟢 Normal: Dentist view own appointment
        [Fact(DisplayName = "[Unit] Dentist_Can_View_Own_Appointment")]
        public async System.Threading.Tasks.Task Dentist_Can_View_Own_Appointment()
        {
            int appointmentId = 13;
            int userId = 2;
            SetupHttpContext("dentist", userId);

            // repository says appointment belongs to patient
            _appointmentRepoMock
                .Setup(r => r.CheckDentistAppointmentByUserIdAsync(appointmentId, userId))
                .ReturnsAsync(true);

            // repository returns an Appointment entity
            var appointment = new Appointment
            {
                AppointmentId = appointmentId,
                // ...fill other properties if needed
            };
            _appointmentRepoMock
                .Setup(r => r.GetAppointmentByIdAsync(appointmentId))
                .ReturnsAsync(appointment);

            // mapper returns a DTO without AppointmentId set
            var dto = new AppointmentDTO { /* other fields */ };
            _mapperMock
                .Setup(m => m.Map<AppointmentDTO>(appointment))
                .Returns(dto);

            var result = await _handler.Handle(
                new ViewDetailAppointmentCommand(appointmentId),
                CancellationToken.None);

            Assert.NotNull(result);
            Assert.Equal(appointmentId, result.AppointmentId);
        }

        // 🟢 AbNormal: Patient cannot view others' appointment
        [Fact(DisplayName = "[Unit] Dentist_Cannot_View_Others_Appointment")]
        public async System.Threading.Tasks.Task Dentist_Cannot_View_Others_Appointment()
        {
            int appointmentId = 6;
            int userId = 3;
            SetupHttpContext("dentist", userId);

            // repository says appointment NOT belong to patient
            _appointmentRepoMock
                .Setup(r => r.CheckDentistAppointmentByUserIdAsync(appointmentId, userId))
                .ReturnsAsync(false);

            await Assert.ThrowsAsync<Exception>(async () =>
                await _handler.Handle(
                    new ViewDetailAppointmentCommand(appointmentId),
                    CancellationToken.None)
            );
        }

        // 🟢 Normal: Non-patient roles can view any appointment
        [Theory(DisplayName = "[Unit] NonPatientRole_Can_View_Or_NotFound")]
        [InlineData("Owner")]
        [InlineData("Receptionist")]
        public async System.Threading.Tasks.Task OtherRole_Can_View_Or_NotFound(string role)
        {
            int appointmentId = 31;
            SetupHttpContext(role, 14);

            // Case 1: appointment exists
            var appointment = new Appointment { AppointmentId = appointmentId };
            _appointmentRepoMock
                .Setup(r => r.GetAppointmentByIdAsync(appointmentId))
                .ReturnsAsync(appointment);

            var dto = new AppointmentDTO();
            _mapperMock
                .Setup(m => m.Map<AppointmentDTO>(appointment))
                .Returns(dto);

            var result = await _handler.Handle(
                new ViewDetailAppointmentCommand(appointmentId),
                CancellationToken.None);
            Assert.NotNull(result);
            Assert.Equal(appointmentId, result.AppointmentId);

            // Case 2: appointment not found
            _appointmentRepoMock
                .Setup(r => r.GetAppointmentByIdAsync(appointmentId))
                .ReturnsAsync((Appointment)null);

            await Assert.ThrowsAsync<Exception>(async () =>
                await _handler.Handle(
                    new ViewDetailAppointmentCommand(appointmentId),
                    CancellationToken.None)
            );
        }
        [Theory(DisplayName = "[Unit] PatientRole_CaseInsensitive_Can_View_Own")]
        [InlineData("Patient")]
        [InlineData("PATIENT")]
        [InlineData("pAtIeNt")]
        public async System.Threading.Tasks.Task PatientRole_CaseInsensitive_Can_View_Own(string roleVariant)
        {
            int appointmentId = 2, userId = 5;
            SetupHttpContext(roleVariant, userId);

            _appointmentRepoMock
                .Setup(r => r.CheckPatientAppointmentByUserIdAsync(appointmentId, userId))
                .ReturnsAsync(true);

            var appointment = new Appointment { AppointmentId = appointmentId };
            _appointmentRepoMock
                .Setup(r => r.GetAppointmentByIdAsync(appointmentId))
                .ReturnsAsync(appointment);

            var dto = new AppointmentDTO();
            _mapperMock
                .Setup(m => m.Map<AppointmentDTO>(appointment))
                .Returns(dto);

            var result = await _handler.Handle(
                new ViewDetailAppointmentCommand(appointmentId),
                CancellationToken.None);

            Assert.NotNull(result);
            Assert.Equal(appointmentId, result.AppointmentId);
        }

    }
}
