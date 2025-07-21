using Application.Constants;
using Application.Usecases.Assistant.ViewPrescriptionTemplate;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants.ViewPresciptionTemplate
{
    public class ViewPrescriptionIntegrationTest
    {
        private readonly ApplicationDbContext _context;
        private readonly ViewPrescriptionTemplateHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ViewPrescriptionIntegrationTest()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("ViewPrescriptionTemplateTestDb"));

            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();

            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            var repository = new PrescriptionTemplateRepository(_context);

            _handler = new ViewPrescriptionTemplateHandler(
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
                    PreTemplateName = "Template A",
                    PreTemplateContext = "Drink water 3 times",
                    CreatedAt = new DateTime(2025, 7, 1)
                },
                new PrescriptionTemplate
                {
                    PreTemplateID = 2,
                    PreTemplateName = "Template B",
                    PreTemplateContext = "Take Vitamin C daily",
                    CreatedAt = new DateTime(2025, 7, 2)
                }
            );

            _context.SaveChanges();
        }

        [Fact(DisplayName = "Normal - UTCID01 - Assistant views prescription templates successfully")]
        public async System.Threading.Tasks.Task UTCID01_ViewPrescriptionTemplates_Success()
        {
            SetupHttpContext("Assistant");

            var result = await _handler.Handle(new ViewPrescriptionTemplateCommand(), default);

            Assert.NotNull(result);
            Assert.Equal(2, result.Count);
            Assert.Contains(result, t => t.PreTemplateName == "Template A");
            Assert.Contains(result, t => t.PreTemplateName == "Template B");
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - Not logged in should throw MSG26")]
        public async System.Threading.Tasks.Task UTCID02_ViewPrescriptionTemplates_NoLogin_Throws()
        {
            _httpContextAccessor.HttpContext = null;

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new ViewPrescriptionTemplateCommand(), default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Role is not Assistant should throw MSG26")]
        public async System.Threading.Tasks.Task UTCID03_ViewPrescriptionTemplates_WrongRole_Throws()
        {
            SetupHttpContext("abc");

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new ViewPrescriptionTemplateCommand(), default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }
    }
}
