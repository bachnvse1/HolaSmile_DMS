using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Patients.CancelAppointment;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Patients.CancelAppointment
{
    public class CancelAppointmentHandlerTest
    {
        private readonly Mock<IAppointmentRepository> _appointmentRepoMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly Mock<IDentistRepository> _dentistRepositoryMock;
        private readonly Mock<IUserCommonRepository> _userCommonRepositoryMock;
        private readonly IMediator _mediator;


        private readonly CancelAppointmentHandle _handler;

        public CancelAppointmentHandlerTest()
        {
            _appointmentRepoMock = new Mock<IAppointmentRepository>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _handler = new CancelAppointmentHandle(
                _appointmentRepoMock.Object,
                _httpContextAccessorMock.Object,
                _dentistRepositoryMock.Object,
                _userCommonRepositoryMock.Object,
                _mediator = Mock.Of<IMediator>()
            );

        }

        private void SetupHttpContext(string role, int userId)
        {
            var claims = new[]
            {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        };
            var identity = new ClaimsIdentity(claims, "Test");
            var principal = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = principal };

            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);
        }

        [Fact(DisplayName = "[Unit - Abnormal] Unauthorized_Role_Throws")]
        public async System.Threading.Tasks.Task Unauthorized_Role_Throws()
        {
            // Arrange: HttpContext = null
            _httpContextAccessorMock
                .Setup(x => x.HttpContext)
                .Returns((HttpContext)null);

            // Act
            var result = await _handler.Handle(
                new CancelAppointmentCommand(appointmentId: 1),
                CancellationToken.None);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG26, result);
            _appointmentRepoMock.Verify(r =>
                r.CancelAppointmentAsync(It.IsAny<int>(), It.IsAny<int>()),
                Times.Never);
            SetupHttpContext("dentist", 1);
            var cmd = new CancelAppointmentCommand(99);
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(cmd, default));
        }

        [Fact(DisplayName = "[Unit - Abnormal] Null_User_Throws")]
        public async System.Threading.Tasks.Task Null_User_Throws()
        {
            int userId = 3;
            int appointmentId = 21;

            // Arrange
            SetupHttpContext(role, userId);

            // Act
            var result = await _handler.Handle(
                new CancelAppointmentCommand(appointmentId),
                CancellationToken.None);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG26, result);
            _appointmentRepoMock.Verify(r =>
                r.CancelAppointmentAsync(It.IsAny<int>(), It.IsAny<int>()),
                Times.Never);
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns((HttpContext)null);
            var cmd = new CancelAppointmentCommand(1);
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(cmd, default));
        }

        [Fact(DisplayName = "[Unit - Normal] Cancel_Success_Returns_Message")]
        public async System.Threading.Tasks.Task Cancel_Success_Returns_Message()
        {
            SetupHttpContext("patient", 2);
            var cmd = new CancelAppointmentCommand(123);
            // Act
            var result = await _handler.Handle(
                new CancelAppointmentCommand(appointmentId),
                CancellationToken.None);
            _appointmentRepoMock.Setup(r => r.CancelAppointmentAsync(123, 2)).ReturnsAsync(true);

            var result = await _handler.Handle(cmd, default);
            Assert.Equal(MessageConstants.MSG.MSG06, result);
        }

        [Fact(DisplayName = "[Unit - Abnormal] Cancel_Failed_Returns_Error")]
        public async System.Threading.Tasks.Task Cancel_Failed_Returns_Error()
        {
            SetupHttpContext("patient", 2);
            var cmd = new CancelAppointmentCommand(123);

            _appointmentRepoMock.Setup(r => r.CancelAppointmentAsync(123, 2)).ReturnsAsync(false);
            // Act
            var result = await _handler.Handle(
                new CancelAppointmentCommand(appointmentId),
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
                new CancelAppointmentCommand(appointmentId),
                CancellationToken.None);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG06, result);
            _appointmentRepoMock.Verify(r =>
                r.CancelAppointmentAsync(appointmentId, userId),
                Times.Once);
            var result = await _handler.Handle(cmd, default);
            Assert.Equal(MessageConstants.MSG.MSG58, result);
        }


    }
}
