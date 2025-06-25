using System.Security.Claims;
using Application.Constants;
using Application.Usecases.Patients.CancelAppointment;
using HDMS_API.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Patients.CancelAppointment
{
    public class CancelAppointmentHandlerTest
    {
        private readonly Mock<IAppointmentRepository> _appointmentRepoMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly CancleAppointmentHandle _handler;

        public CancelAppointmentHandlerTest()
        {
            _appointmentRepoMock = new Mock<IAppointmentRepository>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();

            _handler = new CancleAppointmentHandle(
                _appointmentRepoMock.Object,
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
            var ctx = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"))
            };
            _httpContextAccessorMock
                .Setup(x => x.HttpContext)
                .Returns(ctx);
        }

        // 🟢 Abnormal: Unauthenticated user cann't view all appointments
        [Fact(DisplayName = "[Unit] Unauthenticated_HttpContextNull_Returns_MSG26")]
        public async System.Threading.Tasks.Task Unauthenticated_HttpContextNull_Returns_MSG26()
        {
            // Arrange: HttpContext = null
            _httpContextAccessorMock
                .Setup(x => x.HttpContext)
                .Returns((HttpContext)null);

            // Act
            var result = await _handler.Handle(
                new CancleAppointmentCommand(appointmentId: 1),
                CancellationToken.None);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG26, result);
            _appointmentRepoMock.Verify(r =>
                r.CancelAppointmentAsync(It.IsAny<int>(), It.IsAny<int>()),
                Times.Never);
        }


        [Theory(DisplayName = "[Unit] NonPatientRole_Returns_NoPermission")]
        [InlineData("receptionist")]
        [InlineData("assisstant")]
        [InlineData("dentist")]
        [InlineData("owner")]
        public async System.Threading.Tasks.Task NonPatientRole_Returns_MSG26(string role)
        {
            int userId = 3;
            int appointmentId = 21;

            // Arrange
            SetupHttpContext(role, userId);

            // Act
            var result = await _handler.Handle(
                new CancleAppointmentCommand(appointmentId),
                CancellationToken.None);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG26, result);
            _appointmentRepoMock.Verify(r =>
                r.CancelAppointmentAsync(It.IsAny<int>(), It.IsAny<int>()),
                Times.Never);
        }

        // 🟢 Normal: Patient CaseInsensitive
        [Theory(DisplayName = "[Unit] Patient_CaseInsensitive_Cancel_Success")]
        [InlineData("patient")]
        [InlineData("PATIENT")]
        [InlineData("PaTiEnT")]
        public async System.Threading.Tasks.Task Patient_CaseInsensitive_Cancel_Success(string role)
        {
            // Arrange
            int appointmentId = 6, userId = 16;
            SetupHttpContext(role, userId);

            _appointmentRepoMock
                .Setup(r => r.CancelAppointmentAsync(appointmentId, userId))
                .ReturnsAsync(true);

            // Act
            var result = await _handler.Handle(
                new CancleAppointmentCommand(appointmentId),
                CancellationToken.None);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG06, result);
            _appointmentRepoMock.Verify(r =>
                r.CancelAppointmentAsync(appointmentId, userId),
                Times.Once);
        }

        [Fact(DisplayName = "[Unit] Patient_Cancel_Failure_Returns_MSG58")]
        public async System.Threading.Tasks.Task Patient_Cancel_Failure_Returns_MSG58()
        {
            // Arrange
            string role = "patient";
            int appointmentId = 6, userId = 20;
            SetupHttpContext(role, userId);

            _appointmentRepoMock
                .Setup(r => r.CancelAppointmentAsync(appointmentId, userId))
                .ReturnsAsync(false);

            // Act
            var result = await _handler.Handle(
                new CancleAppointmentCommand(appointmentId),
                CancellationToken.None);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG58, result);
            _appointmentRepoMock.Verify(r =>
                r.CancelAppointmentAsync(appointmentId, userId),
                Times.Once);
        }

        [Fact(DisplayName = "[Unit] Patient_Cancel_OwnAppointment_Returns_MSG06")]
        public async System.Threading.Tasks.Task Patient_Cancel_OwnAppointment_Returns_MSG06()
        {
            // Arrange
            int appointmentId = 6, userId = 16;
            SetupHttpContext("patient", userId);

            // Giả lập: repository chỉ cancel khi là owner → trả true
            _appointmentRepoMock
                .Setup(r => r.CancelAppointmentAsync(appointmentId, userId))
                .ReturnsAsync(true);

            // Act
            var result = await _handler.Handle(
                new CancleAppointmentCommand(appointmentId),
                CancellationToken.None);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG06, result);
            _appointmentRepoMock.Verify(r =>
                r.CancelAppointmentAsync(appointmentId, userId),
                Times.Once);
        }


    }
}
