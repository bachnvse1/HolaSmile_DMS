/*
using Application.Constants;
using Application.Usecases.Assistant.EditWarrantyCard;
using Domain.Entities;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants
{
    public class EditWarrantyCardHandlerTests
    {
        private readonly ApplicationDbContext _context;
        private readonly EditWarrantyCardHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public EditWarrantyCardHandlerTests()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()));

            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();

            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            var repository = new WarrantyCardRepository(_context);

            _handler = new EditWarrantyCardHandler(
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
            _context.WarrantyCards.RemoveRange(_context.WarrantyCards);
            _context.SaveChanges();

            _context.WarrantyCards.AddRange(
                new WarrantyCard
                {
                    WarrantyCardID = 1,
                    TreatmentRecordID = 1,
                    StartDate = new DateTime(2025, 1, 1),
                    EndDate = new DateTime(2026, 1, 1),
                    Duration = 12,
                    Status = true,
                    CreateBy = 1,
                    IsDeleted = false
                },
                new WarrantyCard
                {
                    WarrantyCardID = 2,
                    TreatmentRecordID = 2,
                    StartDate = new DateTime(2025, 2, 1),
                    EndDate = new DateTime(2026, 2, 1),
                    Duration = 12,
                    Status = true,
                    CreateBy = 1,
                    IsDeleted = true
                }
            );

            _context.SaveChanges();
        }

        [Fact(DisplayName = "Normal - UTCID01 - Assistant edits warranty card successfully")]
        public async System.Threading.Tasks.Task UTCID01_EditWarrantyCard_Success()
        {
            // Arrange
            SetupHttpContext("Assistant");

            var command = new EditWarrantyCardCommand
            {
                WarrantyCardId = 1,
                Duration = 24,
                Status = false
            };

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG106, result);

            var updated = _context.WarrantyCards.First(x => x.WarrantyCardID == 1);
            Assert.Equal(24, updated.Duration);
            Assert.False(updated.Status);
            Assert.Equal(new DateTime(2025, 1, 1).AddMonths(24), updated.EndDate);
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - Not logged in should throw MSG17")]
        public async System.Threading.Tasks.Task UTCID02_NotLoggedIn_Throws()
        {
            _httpContextAccessor.HttpContext = null;

            var command = new EditWarrantyCardCommand
            {
                WarrantyCardId = 1,
                Duration = 12,
                Status = true
            };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG17, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Role not allowed should throw MSG26")]
        public async System.Threading.Tasks.Task UTCID03_InvalidRole_Throws()
        {
            SetupHttpContext("Patient");

            var command = new EditWarrantyCardCommand
            {
                WarrantyCardId = 1,
                Duration = 12,
                Status = true
            };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID04 - Card not found should throw MSG102")]
        public async System.Threading.Tasks.Task UTCID04_CardNotFound_Throws()
        {
            SetupHttpContext("Assistant");

            var command = new EditWarrantyCardCommand
            {
                WarrantyCardId = 999,
                Duration = 12,
                Status = true
            };

            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG102, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID05 - Invalid duration should throw MSG98")]
        public async System.Threading.Tasks.Task UTCID05_InvalidDuration_Throws()
        {
            SetupHttpContext("Assistant");

            var command = new EditWarrantyCardCommand
            {
                WarrantyCardId = 1,
                Duration = 0,
                Status = true
            };

            var ex = await Assert.ThrowsAsync<FormatException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG98, ex.Message);
        }
    }
}
*/
