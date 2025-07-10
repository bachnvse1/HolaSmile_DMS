using Application.Constants;
using Application.Usecases.Assistants.UpdatePrescriptionTemplate;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants
{
    public class UpdatePrescriptionTemplateTest
    {
        private readonly ApplicationDbContext _context;
        private readonly UpdatePrescriptionTemplateHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UpdatePrescriptionTemplateTest()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("UpdatePrescriptionTemplateTestDb"));

            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();

            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            var repository = new PrescriptionTemplateRepository(_context);

            _handler = new UpdatePrescriptionTemplateHandler(
                repository,
                _httpContextAccessor
            );

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
                    PreTemplateName = "Original Name",
                    PreTemplateContext = "Original Context",
                    CreatedAt = new DateTime(2025, 7, 1),
                    IsDeleted = false
                },
                new PrescriptionTemplate
                {
                    PreTemplateID = 2,
                    PreTemplateName = "Deleted Template",
                    PreTemplateContext = "Deleted",
                    CreatedAt = new DateTime(2025, 7, 2),
                    IsDeleted = true
                }
            );

            _context.SaveChanges();
        }

        [Fact(DisplayName = "Normal - UTCID01 - Assistant updates template successfully")]
        public async System.Threading.Tasks.Task UTCID01_UpdatePrescriptionTemplate_Success()
        {
            // Arrange
            SetupHttpContext("Assistant");

            var command = new UpdatePrescriptionTemplateCommand
            {
                PreTemplateID = 1,
                PreTemplateName = "Updated Name",
                PreTemplateContext = "Updated Context"
            };

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG109, result);

            var updated = _context.PrescriptionTemplates.First(x => x.PreTemplateID == 1);
            Assert.Equal("Updated Name", updated.PreTemplateName);
            Assert.Equal("Updated Context", updated.PreTemplateContext);
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - Not logged in should throw MSG26")]
        public async System.Threading.Tasks.Task UTCID02_NotLoggedIn_Throws()
        {
            _httpContextAccessor.HttpContext = null;

            var command = new UpdatePrescriptionTemplateCommand { PreTemplateID = 1 };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Role not Assistant should throw MSG26")]
        public async System.Threading.Tasks.Task UTCID03_NotAssistantRole_Throws()
        {
            SetupHttpContext("Dentist");

            var command = new UpdatePrescriptionTemplateCommand { PreTemplateID = 1 };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID04 - Template not found should throw MSG110")]
        public async System.Threading.Tasks.Task UTCID04_TemplateNotFound_Throws()
        {
            SetupHttpContext("Assistant");

            var command = new UpdatePrescriptionTemplateCommand { PreTemplateID = 999 };

            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG110, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID05 - Template is deleted should throw MSG110")]
        public async System.Threading.Tasks.Task UTCID05_TemplateDeleted_Throws()
        {
            SetupHttpContext("Assistant");

            var command = new UpdatePrescriptionTemplateCommand { PreTemplateID = 2 };

            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG110, ex.Message);
        }
    }
}
