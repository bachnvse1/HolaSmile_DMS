using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Patients.CancelAppointment;
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
            _handler = new CancleAppointmentHandle(_appointmentRepoMock.Object, _httpContextAccessorMock.Object);
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
            SetupHttpContext("dentist", 1);
            var cmd = new CancelAppointmentCommand(99);
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(cmd, default));
        }

        [Fact(DisplayName = "[Unit - Abnormal] Null_User_Throws")]
        public async System.Threading.Tasks.Task Null_User_Throws()
        {
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns((HttpContext)null);
            var cmd = new CancelAppointmentCommand(1);
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(cmd, default));
        }

        [Fact(DisplayName = "[Unit - Normal] Cancel_Success_Returns_Message")]
        public async System.Threading.Tasks.Task Cancel_Success_Returns_Message()
        {
            SetupHttpContext("patient", 2);
            var cmd = new CancelAppointmentCommand(123);

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

            var result = await _handler.Handle(cmd, default);
            Assert.Equal(MessageConstants.MSG.MSG58, result);
        }


    }
}
