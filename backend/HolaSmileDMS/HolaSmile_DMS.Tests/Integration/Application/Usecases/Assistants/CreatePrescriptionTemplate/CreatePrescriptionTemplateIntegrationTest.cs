using Application.Constants;
using Application.Usecases.Assistants.CreatePrescriptionTemplate;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants
{
    public class CreatePrescriptionTemplateIntegrationTest
    {
        private readonly ApplicationDbContext _context;
        private readonly CreatePrescriptionTemplateHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CreatePrescriptionTemplateIntegrationTest()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("CreatePrescriptionTemplateDb"));

            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();

            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            var repository = new PrescriptionTemplateRepository(_context);

            _handler = new CreatePrescriptionTemplateHandler(repository, _httpContextAccessor);

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
        }

        [Fact(DisplayName = "Normal - UTCID01 - Assistant creates template successfully")]
        public async System.Threading.Tasks.Task UTCID01_CreatePrescriptionTemplate_Success()
        {
            // Arrange
            SetupHttpContext("Assistant");

            var command = new CreatePrescriptionTemplateCommand
            {
                PreTemplateName = "Template A",
                PreTemplateContext = "Some content"
            };

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG111, result);
            var created = _context.PrescriptionTemplates.FirstOrDefault(x => x.PreTemplateName == "Template A");
            Assert.NotNull(created);
            Assert.Equal("Some content", created.PreTemplateContext);
            Assert.False(created.IsDeleted);
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - Not logged in should throw MSG26")]
        public async System.Threading.Tasks.Task UTCID02_NotLoggedIn_Throws()
        {
            _httpContextAccessor.HttpContext = null;

            var command = new CreatePrescriptionTemplateCommand
            {
                PreTemplateName = "Template A"
            };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Role not Assistant should throw MSG26")]
        public async System.Threading.Tasks.Task UTCID03_NotAssistantRole_Throws()
        {
            SetupHttpContext("Dentist");

            var command = new CreatePrescriptionTemplateCommand
            {
                PreTemplateName = "Template A"
            };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }
    }
}
