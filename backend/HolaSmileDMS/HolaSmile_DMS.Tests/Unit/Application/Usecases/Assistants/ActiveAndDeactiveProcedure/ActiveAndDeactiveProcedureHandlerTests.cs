using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.ProcedureTemplate.ActiveAndDeactiveProcedure;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants
{
    public class ActiveAndDeactiveProcedureHandlerTests
    {
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly Mock<IProcedureRepository> _procedureRepositoryMock;
        private readonly ActiveAndDeactiveProcedureHandler _handler;

        public ActiveAndDeactiveProcedureHandlerTests()
        {
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _procedureRepositoryMock = new Mock<IProcedureRepository>();
            _handler = new ActiveAndDeactiveProcedureHandler(_procedureRepositoryMock.Object, _httpContextAccessorMock.Object);
        }

        private void SetupHttpContext(string role, string userId = "1")
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Role, role)
            };
            var identity = new ClaimsIdentity(claims, "mock");
            var user = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = user };
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);
        }

        [Fact(DisplayName = "Normal - UTCID01 - Toggle IsDeleted from false to true")]
        public async System.Threading.Tasks.Task UTCID01_ToggleToDeleted_ReturnsTrue()
        {
            SetupHttpContext("assistant", "1");

            var procedure = new Procedure { ProcedureId = 10, IsDeleted = false };

            _procedureRepositoryMock.Setup(r => r.GetProcedureByProcedureId(10)).ReturnsAsync(procedure);
            _procedureRepositoryMock.Setup(r => r.UpdateProcedureAsync(It.IsAny<Procedure>())).ReturnsAsync(true);

            var command = new ActiveAndDeactiveProcedureCommand { ProcedureId = 10 };
            var result = await _handler.Handle(command, default);

            Assert.True(result);
            Assert.True(procedure.IsDeleted);
            Assert.Equal(1, procedure.UpdatedBy);
        }

        [Fact(DisplayName = "Normal - UTCID02 - Toggle IsDeleted from true to false")]
        public async System.Threading.Tasks.Task UTCID02_ToggleToUndeleted_ReturnsTrue()
        {
            SetupHttpContext("assistant", "2");

            var procedure = new Procedure { ProcedureId = 11, IsDeleted = true };

            _procedureRepositoryMock.Setup(r => r.GetProcedureByProcedureId(11)).ReturnsAsync(procedure);
            _procedureRepositoryMock.Setup(r => r.UpdateProcedureAsync(It.IsAny<Procedure>())).ReturnsAsync(true);

            var command = new ActiveAndDeactiveProcedureCommand { ProcedureId = 11 };
            var result = await _handler.Handle(command, default);

            Assert.True(result);
            Assert.False(procedure.IsDeleted);
            Assert.Equal(2, procedure.UpdatedBy);
        }

        [Fact(DisplayName = "Invalid - UTCID03 - Procedure not found")]
        public async System.Threading.Tasks.Task UTCID03_ProcedureNotFound_ThrowsException()
        {
            SetupHttpContext("assistant", "1");

            _procedureRepositoryMock.Setup(r => r.GetProcedureByProcedureId(999)).ReturnsAsync((Procedure)null);

            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(new ActiveAndDeactiveProcedureCommand { ProcedureId = 999 }, default));

            Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
        }

        [Fact(DisplayName = "Unauthorized - UTCID04 - Role is null")]
        public async System.Threading.Tasks.Task UTCID04_RoleIsNull_ThrowsUnauthorized()
        {
            var claims = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, "1") };
            var identity = new ClaimsIdentity(claims);
            var user = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = user };
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);

            var command = new ActiveAndDeactiveProcedureCommand { ProcedureId = 5 };
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
        }

        [Fact(DisplayName = "Error - UTCID05 - Update failed returns false")]
        public async System.Threading.Tasks.Task UTCID05_UpdateFails_ReturnsFalse()
        {
            SetupHttpContext("assistant", "1");

            var procedure = new Procedure { ProcedureId = 20, IsDeleted = false };
            _procedureRepositoryMock.Setup(r => r.GetProcedureByProcedureId(20)).ReturnsAsync(procedure);
            _procedureRepositoryMock.Setup(r => r.UpdateProcedureAsync(It.IsAny<Procedure>())).ReturnsAsync(false);

            var result = await _handler.Handle(new ActiveAndDeactiveProcedureCommand { ProcedureId = 20 }, default);
            Assert.False(result);
        }
    }
}
