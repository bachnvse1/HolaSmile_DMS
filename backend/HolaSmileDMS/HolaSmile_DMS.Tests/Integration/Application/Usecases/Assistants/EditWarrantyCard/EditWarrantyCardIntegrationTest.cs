using Application.Constants;
using Application.Usecases.Assistant.EditWarrantyCard;
using Domain.Entities;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants
{
    public class EditWarrantyCardIntegrationTest
    {
        private readonly ApplicationDbContext _context;
        private readonly EditWarrantyCardHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public EditWarrantyCardIntegrationTest()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _httpContextAccessor = SetupHttpContext("Assistant", 1);
            var repository = new WarrantyCardRepository(_context);

            _handler = new EditWarrantyCardHandler(repository, _httpContextAccessor);

            SeedData();
        }

        private void SeedData()
        {
            _context.Users.Add(new User
            {
                UserID = 1,
                Username = "0111111111",
                Fullname = "Assistant A",
                Phone = "0111111111"
            });

            _context.TreatmentRecords.Add(new TreatmentRecord
            {
                TreatmentRecordID = 1,
                // các field khác nếu cần thiết
            });

            _context.WarrantyCards.Add(new WarrantyCard
            {
                WarrantyCardID = 1,
                StartDate = DateTime.Today.AddMonths(-2),
                EndDate = DateTime.Today.AddMonths(4),
                Duration = 6,
                Status = true,
                CreatedAt = DateTime.Now.AddMonths(-2),
                CreateBy = 1,
                TreatmentRecordID = 1,
                IsDeleted = false
            });

            _context.SaveChanges();
        }


        private IHttpContextAccessor SetupHttpContext(string role, int userId)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);

            var context = new DefaultHttpContext { User = principal };

            var httpContextAccessor = new Mock<IHttpContextAccessor>();
            httpContextAccessor.Setup(h => h.HttpContext).Returns(context);

            return httpContextAccessor.Object;
        }

        [Fact(DisplayName = "ITCID01 - Edit warranty card successfully")]
        public async System.Threading.Tasks.Task ITCID01_EditWarrantyCard_Success()
        {
            // Arrange
            var command = new EditWarrantyCardCommand
            {
                WarrantyCardId = 1,
                Duration = 12,
                Status = false
            };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG106, result);
            var card = await _context.WarrantyCards.FindAsync(1);
            Assert.Equal(12, card.Duration);
            Assert.Equal(false, card.Status);
            Assert.Equal(card.StartDate.AddMonths(12), card.EndDate);
        }

        [Fact(DisplayName = "ITCID02 - Edit non-existing card should throw MSG103")]
        public async System.Threading.Tasks.Task ITCID02_EditWarrantyCard_NotFound()
        {
            var command = new EditWarrantyCardCommand
            {
                WarrantyCardId = 999,
                Duration = 6,
                Status = true
            };

            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG103, ex.Message);
        }

        [Fact(DisplayName = "ITCID03 - Edit with invalid duration should throw MSG98")]
        public async System.Threading.Tasks.Task ITCID03_EditWarrantyCard_InvalidDuration()
        {
            var command = new EditWarrantyCardCommand
            {
                WarrantyCardId = 1,
                Duration = 0,
                Status = true
            };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG98, ex.Message);
        }

        [Fact(DisplayName = "ITCID04 - Unauthorized role should throw MSG26")]
        public async System.Threading.Tasks.Task ITCID04_EditWarrantyCard_UnauthorizedRole()
        {
            var handler = new EditWarrantyCardHandler(
                new WarrantyCardRepository(_context),
                SetupHttpContext("Patient", 2));

            var command = new EditWarrantyCardCommand
            {
                WarrantyCardId = 1,
                Duration = 6,
                Status = true
            };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "ITCID05 - HttpContext null should throw MSG17")]
        public async System.Threading.Tasks.Task ITCID05_EditWarrantyCard_NullHttpContext()
        {
            var mockAccessor = new Mock<IHttpContextAccessor>();
            mockAccessor.Setup(x => x.HttpContext).Returns((HttpContext)null);

            var handler = new EditWarrantyCardHandler(
                new WarrantyCardRepository(_context),
                mockAccessor.Object);

            var command = new EditWarrantyCardCommand
            {
                WarrantyCardId = 1,
                Duration = 6,
                Status = true
            };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG17, ex.Message);
        }
    }
}