using Application.Constants;
using Application.Usecases.Assistants.DeactivePrescriptionTemplate;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants
{
    public class DeactivePrescriptionTemplateIntegrationTest
    {
        private readonly ApplicationDbContext _context;
        private readonly DeactivePrescriptionTemplateHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public DeactivePrescriptionTemplateIntegrationTest()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("DeactivePrescriptionTemplateDb"));

            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();

            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            var repository = new PrescriptionTemplateRepository(_context);

            _handler = new DeactivePrescriptionTemplateHandler(repository, _httpContextAccessor);

            SeedData();
        }

        private void SetupHttpContext(string role)
        {
            var context = new DefaultHttpContext();
            context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "1"),
                new Claim(ClaimTypes.Role, role)
            }, "TestAuth"));

            _httpContextAccessor.HttpContext = context;
        }

        private void SeedData()
        {
            _context.PrescriptionTemplates.RemoveRange(_context.PrescriptionTemplates);
            _context.SaveChanges();

            _context.PrescriptionTemplates.AddRange(
                new PrescriptionTemplate
                {
                    PreTemplateID = 1,
                    PreTemplateName = "Template A",
                    PreTemplateContext = "Content A",
                    CreatedAt = DateTime.UtcNow,
                    IsDeleted = false
                },
                new PrescriptionTemplate
                {
                    PreTemplateID = 2,
                    PreTemplateName = "Template B",
                    PreTemplateContext = "Content B",
                    CreatedAt = DateTime.UtcNow,
                    IsDeleted = true
                }
            );

            _context.SaveChanges();
        }

        [Fact(DisplayName = "Normal - UTCID01 - Assistant deactivates template successfully")]
        public async System.Threading.Tasks.Task UTCID01_Deactive_Success()
        {
            // Arrange
            SetupHttpContext("Assistant");

            var command = new DeactivePrescriptionTemplateCommand { PreTemplateID = 1 };

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG112, result);

            var template = _context.PrescriptionTemplates.First(x => x.PreTemplateID == 1);
            Assert.True(template.IsDeleted);
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - Not logged in should throw MSG26")]
        public async System.Threading.Tasks.Task UTCID02_NotLoggedIn_Throws()
        {
            _httpContextAccessor.HttpContext = null;

            var command = new DeactivePrescriptionTemplateCommand { PreTemplateID = 1 };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Role not Assistant should throw MSG26")]
        public async System.Threading.Tasks.Task UTCID03_NotAssistantRole_Throws()
        {
            SetupHttpContext("Dentist");

            var command = new DeactivePrescriptionTemplateCommand { PreTemplateID = 1 };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID04 - Template not found should throw MSG110")]
        public async System.Threading.Tasks.Task UTCID04_TemplateNotFound_Throws()
        {
            SetupHttpContext("Assistant");

            var command = new DeactivePrescriptionTemplateCommand { PreTemplateID = 999 };

            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG110, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID05 - Template already deleted should throw MSG110")]
        public async System.Threading.Tasks.Task UTCID05_AlreadyDeleted_Throws()
        {
            SetupHttpContext("Assistant");

            var command = new DeactivePrescriptionTemplateCommand { PreTemplateID = 2 };

            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG110, ex.Message);
        }
    }
}
