using Application.Constants;
using Application.Usecases.Assistant.DeactiveWarrantyCard;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistant
{
    public class DeactiveWarrantyCardIntegrationTest
    {
        private readonly ApplicationDbContext _context;
        private readonly DeactiveWarrantyCardHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public DeactiveWarrantyCardIntegrationTest()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("DeactiveWarrantyCardTestDb"));

            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();

            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            var warrantyRepo = new WarrantyCardRepository(_context);

            _handler = new DeactiveWarrantyCardHandler(
                warrantyRepo,
                _httpContextAccessor
            );

            SeedData();
        }

        private void SetupHttpContext(string role, string userId = "1")
        {
            var context = new DefaultHttpContext();
            context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Role, role)
            }, "TestAuth"));

            _httpContextAccessor.HttpContext = context;
        }

        private void SeedData()
        {
            _context.WarrantyCards.RemoveRange(_context.WarrantyCards);
            _context.SaveChanges();

            _context.WarrantyCards.Add(new WarrantyCard
            {
                WarrantyCardID = 1,
                StartDate = DateTime.Now.AddMonths(-6),
                EndDate = DateTime.Now.AddMonths(6),
                Term = "12 tháng",
                Status = true
            });

            _context.WarrantyCards.Add(new WarrantyCard
            {
                WarrantyCardID = 2,
                StartDate = DateTime.Now.AddMonths(-12),
                EndDate = DateTime.Now,
                Term = "12 tháng",
                Status = false
            });

            _context.SaveChanges();
        }

        [Fact(DisplayName = "Normal - UTCID01 - Assistant deactivates warranty card successfully")]
        public async System.Threading.Tasks.Task UTCID01_DeactivateWarrantyCard_Success()
        {
            SetupHttpContext("Assistant");

            var command = new DeactiveWarrantyCardCommand
            {
                WarrantyCardId = 1
            };

            var result = await _handler.Handle(command, default);

            Assert.Equal(MessageConstants.MSG.MSG104, result);

            var card = await _context.WarrantyCards.FindAsync(1);
            Assert.False(card!.Status);
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - Not logged in should throw MSG17")]
        public async System.Threading.Tasks.Task UTCID02_DeactivateWarrantyCard_NoLogin_Throws()
        {
            _httpContextAccessor.HttpContext = null;

            var command = new DeactiveWarrantyCardCommand { WarrantyCardId = 1 };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG17, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Role is not assistant should throw MSG26")]
        public async System.Threading.Tasks.Task UTCID03_DeactivateWarrantyCard_WrongRole_Throws()
        {
            SetupHttpContext("Receptionist");

            var command = new DeactiveWarrantyCardCommand { WarrantyCardId = 1 };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID04 - WarrantyCard does not exist should throw MSG102")]
        public async System.Threading.Tasks.Task UTCID04_DeactivateWarrantyCard_NotFound_Throws()
        {
            SetupHttpContext("Assistant");

            var command = new DeactiveWarrantyCardCommand { WarrantyCardId = 999 };

            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG102, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID05 - Already deactivated card should throw MSG103")]
        public async System.Threading.Tasks.Task UTCID05_DeactivateWarrantyCard_AlreadyInactive_Throws()
        {
            SetupHttpContext("Assistant");

            var command = new DeactiveWarrantyCardCommand { WarrantyCardId = 2 };

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG103, ex.Message);
        }
    }
}
