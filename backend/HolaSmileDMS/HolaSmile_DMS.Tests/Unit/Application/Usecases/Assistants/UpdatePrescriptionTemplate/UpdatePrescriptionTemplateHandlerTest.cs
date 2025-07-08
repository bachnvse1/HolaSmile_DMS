using Application.Constants;
using Application.Usecases.Assistants.UpdatePrescriptionTemplate;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants
{
    public class UpdatePrescriptionTemplateHandlerTests
    {
        private readonly Mock<IPrescriptionTemplateRepository> _repoMock = new();
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly UpdatePrescriptionTemplateHandler _handler;

        public UpdatePrescriptionTemplateHandlerTests()
        {
            _handler = new UpdatePrescriptionTemplateHandler(
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

        [Fact(DisplayName = "UTCID01 - Assistant updates template successfully")]
        public async System.Threading.Tasks.Task UTCID01_Assistant_Update_Successfully()
        {
            // Arrange
            SetupHttpContext("Assistant");

            var command = new UpdatePrescriptionTemplateCommand
            {
                PreTemplateID = 1,
                PreTemplateName = "Updated Name",
                PreTemplateContext = "Updated Content"
            };

            var template = new PrescriptionTemplate
            {
                PreTemplateID = 1,
                PreTemplateName = "Old Name",
                PreTemplateContext = "Old Content",
                IsDeleted = false
            };

            _repoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(template);

            _repoMock.Setup(r => r.UpdateAsync(It.IsAny<PrescriptionTemplate>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG109, result);
            Assert.Equal("Updated Name", template.PreTemplateName);
            Assert.Equal("Updated Content", template.PreTemplateContext);
        }

        [Fact(DisplayName = "UTCID02 - HttpContext is null => UnauthorizedAccessException")]
        public async System.Threading.Tasks.Task UTCID02_HttpContext_Null_Should_Throw()
        {
            // Arrange
            SetupHttpContext(null);

            var command = new UpdatePrescriptionTemplateCommand
            {
                PreTemplateID = 1
            };

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

            var command = new UpdatePrescriptionTemplateCommand
            {
                PreTemplateID = 1
            };

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

            var command = new UpdatePrescriptionTemplateCommand { PreTemplateID = 99 };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG110, ex.Message);
        }

        [Fact(DisplayName = "UTCID05 - Template is deleted => KeyNotFoundException")]
        public async System.Threading.Tasks.Task UTCID05_Template_Deleted_Should_Throw()
        {
            // Arrange
            SetupHttpContext("Assistant");

            var deletedTemplate = new PrescriptionTemplate
            {
                PreTemplateID = 1,
                IsDeleted = true
            };

            _repoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(deletedTemplate);

            var command = new UpdatePrescriptionTemplateCommand { PreTemplateID = 1 };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG110, ex.Message);
        }

        [Fact(DisplayName = "UTCID06 - Update fails => throw Exception")]
        public async System.Threading.Tasks.Task UTCID06_Update_Fails_Should_Throw()
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
                .ReturnsAsync(false); // simulate failed update

            var command = new UpdatePrescriptionTemplateCommand
            {
                PreTemplateID = 1,
                PreTemplateName = "Fail Test",
                PreTemplateContext = "Fail"
            };

            // Act & Assert
            await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(command, default));
        }
    }
}
