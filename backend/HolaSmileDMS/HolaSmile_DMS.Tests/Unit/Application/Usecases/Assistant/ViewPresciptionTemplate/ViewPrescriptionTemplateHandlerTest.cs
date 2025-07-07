using Application.Constants;
using Application.Usecases.Assistant.ViewPrescriptionTemplate;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistant
{
    public class ViewPrescriptionTemplateHandlerTests
    {
        private readonly Mock<IPrescriptionTemplateRepository> _repoMock = new();
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly ViewPrescriptionTemplateHandler _handler;

        public ViewPrescriptionTemplateHandlerTests()
        {
            _handler = new ViewPrescriptionTemplateHandler(
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

        [Fact(DisplayName = "UTCID01 - Assistant views prescription templates successfully")]
        public async System.Threading.Tasks.Task UTCID01_Assistant_View_Successfully()
        {
            // Arrange
            SetupHttpContext("Assistant");

            var templates = new List<PrescriptionTemplate>
            {
                new PrescriptionTemplate { PreTemplateID = 1, PreTemplateName = "A", PreTemplateContext = "Use A", CreatedAt = DateTime.Now },
                new PrescriptionTemplate { PreTemplateID = 2, PreTemplateName = "B", PreTemplateContext = "Use B", CreatedAt = DateTime.Now }
            };

            _repoMock.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(templates);

            // Act
            var result = await _handler.Handle(new ViewPrescriptionTemplateCommand(), default);

            // Assert
            Assert.Equal(2, result.Count);
            Assert.Equal("A", result[0].PreTemplateName);
            Assert.Equal("B", result[1].PreTemplateName);
        }

        [Fact(DisplayName = "UTCID02 - HttpContext is null => UnauthorizedAccessException")]
        public async System.Threading.Tasks.Task UTCID02_HttpContext_Null_Should_Throw()
        {
            // Arrange
            SetupHttpContext(null);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new ViewPrescriptionTemplateCommand(), default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID03 - Role is not Assistant => UnauthorizedAccessException")]
        public async System.Threading.Tasks.Task UTCID03_Role_Not_Assistant_Should_Throw()
        {
            // Arrange
            SetupHttpContext("Receptionist");

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new ViewPrescriptionTemplateCommand(), default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }
    }
}
