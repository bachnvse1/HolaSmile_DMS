using Application.Constants;
using Application.Usecases.Assistants.CreatePrescriptionTemplate;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants
{
    public class CreatePrescriptionTemplateHandlerTests
    {
        private readonly Mock<IPrescriptionTemplateRepository> _repoMock = new();
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly CreatePrescriptionTemplateHandler _handler;

        public CreatePrescriptionTemplateHandlerTests()
        {
            _repoMock.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
                     .ReturnsAsync(new List<PrescriptionTemplate>());

            _handler = new CreatePrescriptionTemplateHandler(
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

        [Fact(DisplayName = "UTCID01 - Assistant creates template successfully")]
        public async System.Threading.Tasks.Task UTCID01_Assistant_Create_Successfully()
        {
            // Arrange
            SetupHttpContext("Assistant");

            var command = new CreatePrescriptionTemplateCommand
            {
                PreTemplateName = "Template A",
                PreTemplateContext = "Content A"
            };

            _repoMock.Setup(r => r.CreateAsync(It.IsAny<PrescriptionTemplate>(), It.IsAny<CancellationToken>()))
                     .ReturnsAsync(true);

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG111, result);
        }

        [Fact(DisplayName = "UTCID02 - HttpContext is null => UnauthorizedAccessException")]
        public async System.Threading.Tasks.Task UTCID02_HttpContext_Null_Should_Throw()
        {
            // Arrange
            SetupHttpContext(null);

            var command = new CreatePrescriptionTemplateCommand
            {
                PreTemplateName = "Template B"
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

            var command = new CreatePrescriptionTemplateCommand
            {
                PreTemplateName = "Template C"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID04 - Create fails => throw Exception")]
        public async System.Threading.Tasks.Task UTCID04_Create_Fails_Should_Throw()
        {
            // Arrange
            SetupHttpContext("Assistant");

            var command = new CreatePrescriptionTemplateCommand
            {
                PreTemplateName = "Fail",
                PreTemplateContext = "Fail"
            };

            _repoMock.Setup(r => r.CreateAsync(It.IsAny<PrescriptionTemplate>(), It.IsAny<CancellationToken>()))
                     .ReturnsAsync(false); // simulate failure

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG58, ex.Message);
        }
    }
}
