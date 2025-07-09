using Application.Constants;
using Application.Usecases.Assistants.DeactivePrescriptionTemplate;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants
{
    public class DeactivePrescriptionTemplateHandlerTests
    {
        private readonly Mock<IPrescriptionTemplateRepository> _repoMock = new();
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly DeactivePrescriptionTemplateHandler _handler;

        public DeactivePrescriptionTemplateHandlerTests()
        {
            _handler = new DeactivePrescriptionTemplateHandler(
                _repoMock.Object,
                _httpContextAccessorMock.Object
            );
        }

        private void SetupHttpContext(string? role, string? userId = "1")
        {
            if (role == null)
            {
                _httpContextAccessorMock.Setup(h => h.HttpContext).Returns((HttpContext?)null);
                return;
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, userId ?? "")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = principal };

            _httpContextAccessorMock.Setup(h => h.HttpContext).Returns(context);
        }

        [Fact(DisplayName = "UTCID01 - Assistant deactivates template successfully")]
        public async System.Threading.Tasks.Task UTCID01_Deactive_Success()
        {
            // Arrange
            SetupHttpContext("Assistant");

            var template = new PrescriptionTemplate
            {
                PreTemplateID = 1,
                PreTemplateName = "Template A",
                IsDeleted = false
            };

            _repoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                     .ReturnsAsync(template);

            _repoMock.Setup(r => r.UpdateAsync(It.IsAny<PrescriptionTemplate>(), It.IsAny<CancellationToken>()))
                     .ReturnsAsync(true);

            var command = new DeactivePrescriptionTemplateCommand { PreTemplateID = 1 };

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG112, result);
            Assert.True(template.IsDeleted);
        }

        [Fact(DisplayName = "UTCID02 - HttpContext is null => UnauthorizedAccessException")]
        public async System.Threading.Tasks.Task UTCID02_HttpContext_Null_Should_Throw()
        {
            // Arrange
            SetupHttpContext(null);

            var command = new DeactivePrescriptionTemplateCommand { PreTemplateID = 1 };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID03 - Role is not Assistant => UnauthorizedAccessException")]
        public async System.Threading.Tasks.Task UTCID03_Role_Not_Assistant_Should_Throw()
        {
            // Arrange
            SetupHttpContext("Receptionist");

            var command = new DeactivePrescriptionTemplateCommand { PreTemplateID = 1 };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID04 - Template not found => KeyNotFoundException")]
        public async System.Threading.Tasks.Task UTCID04_Template_Not_Found_Should_Throw()
        {
            // Arrange
            SetupHttpContext("Assistant");

            _repoMock.Setup(r => r.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
                     .ReturnsAsync((PrescriptionTemplate?)null);

            var command = new DeactivePrescriptionTemplateCommand { PreTemplateID = 99 };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG110, ex.Message);
        }

        [Fact(DisplayName = "UTCID05 - Template already deleted => KeyNotFoundException")]
        public async System.Threading.Tasks.Task UTCID05_Template_Already_Deleted_Should_Throw()
        {
            // Arrange
            SetupHttpContext("Assistant");

            var template = new PrescriptionTemplate
            {
                PreTemplateID = 1,
                IsDeleted = true
            };

            _repoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                     .ReturnsAsync(template);

            var command = new DeactivePrescriptionTemplateCommand { PreTemplateID = 1 };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG110, ex.Message);
        }

        [Fact(DisplayName = "UTCID06 - Update fails => Exception")]
        public async System.Threading.Tasks.Task UTCID06_Update_Failed_Should_Throw()
        {
            // Arrange
            SetupHttpContext("Assistant");

            var template = new PrescriptionTemplate
            {
                PreTemplateID = 1,
                IsDeleted = false
            };

            _repoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                     .ReturnsAsync(template);

            _repoMock.Setup(r => r.UpdateAsync(It.IsAny<PrescriptionTemplate>(), It.IsAny<CancellationToken>()))
                     .ReturnsAsync(false); // simulate failure

            var command = new DeactivePrescriptionTemplateCommand { PreTemplateID = 1 };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG58, ex.Message);
        }
    }
}
