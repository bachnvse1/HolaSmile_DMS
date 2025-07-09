/*
using Application.Constants;
using Application.Usecases.Assistant.EditWarrantyCard;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistant
{
    public class EditWarrantyCardIntegrationTest
    {
        private readonly ApplicationDbContext _context;
        private readonly EditWarrantyCardHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public EditWarrantyCardIntegrationTest()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("EditWarrantyCardTestDb"));

            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();

            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            var warrantyRepo = new WarrantyCardRepository(_context);

            _handler = new EditWarrantyCardHandler(
                warrantyRepo,
                _httpContextAccessor
            );

            SeedData();
        }

        private void SetupHttpContext(string role, string userId = "99")
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
                Term = "6 tháng",
                Status = true,
                StartDate = new DateTime(2025, 1, 1),
                EndDate = new DateTime(2025, 7, 1)
            });

            _context.SaveChanges();
        }

        [Fact(DisplayName = "Normal - UTCID01 - Assistant edits warranty card successfully")]
        public async System.Threading.Tasks.Task UTCID01_EditWarrantyCard_Success()
        {
            SetupHttpContext("Assistant");

            var command = new EditWarrantyCardCommand
            {
                WarrantyCardId = 1,
                Term = "12 tháng",
                Status = false
            };

            var result = await _handler.Handle(command, default);

            Assert.Equal(MessageConstants.MSG.MSG106, result);

            var card = await _context.WarrantyCards.FindAsync(1);
            Assert.Equal("12 tháng", card!.Term);
            Assert.False(card.Status);
            Assert.Equal(99, card.UpdatedBy);
            Assert.Equal(card.StartDate.AddMonths(12), card.EndDate);
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - Not logged in should throw MSG17")]
        public async System.Threading.Tasks.Task UTCID02_EditWarrantyCard_NoLogin_Throws()
        {
            _httpContextAccessor.HttpContext = null;

            var command = new EditWarrantyCardCommand
            {
                WarrantyCardId = 1,
                Term = "12 tháng",
                Status = true
            };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG17, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Non-Assistant role should throw MSG26")]
        public async System.Threading.Tasks.Task UTCID03_EditWarrantyCard_WrongRole_Throws()
        {
            SetupHttpContext("Receptionist");

            var command = new EditWarrantyCardCommand
            {
                WarrantyCardId = 1,
                Term = "12 tháng",
                Status = true
            };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID04 - Non-existent warranty card should throw MSG102")]
        public async System.Threading.Tasks.Task UTCID04_EditWarrantyCard_NotFound_Throws()
        {
            SetupHttpContext("Assistant");

            var command = new EditWarrantyCardCommand
            {
                WarrantyCardId = 999,
                Term = "12 tháng",
                Status = true
            };

            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG102, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID05 - Invalid term format should throw MSG98")]
        public async System.Threading.Tasks.Task UTCID05_EditWarrantyCard_InvalidTerm_Throws()
        {
            SetupHttpContext("Assistant");

            var command = new EditWarrantyCardCommand
            {
                WarrantyCardId = 1,
                Term = "xyz",
                Status = true
            };

            var ex = await Assert.ThrowsAsync<FormatException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG98, ex.Message);
        }
    }
}
*/
