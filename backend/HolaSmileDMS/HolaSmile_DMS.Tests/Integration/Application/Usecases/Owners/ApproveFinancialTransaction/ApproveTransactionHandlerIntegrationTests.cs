using System.Security.Claims;
using Application.Interfaces;
using Application.Usecases.Owner.ApproveFinancialTransaction;
using Domain.Entities;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Infrastructure.Repositories;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Owners
{
    public class ApproveTransactionHandlerIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly ApproveTransactionHandler _handler;
        private readonly Mock<IMediator> _mediatorMock;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ApproveTransactionHandlerIntegrationTests()
        {
            // 1. Setup DI + InMemory Database
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase($"ApproveTransactionTestDb_{Guid.NewGuid()}"));

            services.AddScoped<ITransactionRepository, TransactionRepository>();
            services.AddScoped<IUserCommonRepository, UserCommonRepository>();
            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            // 2. Mock Mediator
            _mediatorMock = new Mock<IMediator>();

            // 3. Handler thực tế
            var transactionRepo = new TransactionRepository(_context);
            var userCommonRepo = new UserCommonRepository(_context);
            _handler = new ApproveTransactionHandler(transactionRepo, _httpContextAccessor, userCommonRepo, _mediatorMock.Object);
        }

        private void SeedHttpContext(string role, int userId = 1)
        {
            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, userId.ToString()),
                new(ClaimTypes.Role, role)
            };
            var identity = new ClaimsIdentity(claims);
            var principal = new ClaimsPrincipal(identity);
            _httpContextAccessor.HttpContext = new DefaultHttpContext { User = principal };
        }

        private async Task<int> SeedTransactionAsync(string status = "pending", bool transactionType = true)
        {
            // Seed user tạo transaction (receptionist)
            var user = new User { UserID = 10, Fullname = "Receptionist A", Username = "0123456789", Phone = "0123456789" };
            _context.Users.Add(user);

            // Seed transaction
            var transaction = new FinancialTransaction
            {
                TransactionID = 1,
                TransactionType = transactionType, // true = thu, false = chi
                status = status,
                CreatedBy = user.UserID,
                CreatedAt = DateTime.Now
            };

            _context.FinancialTransactions.Add(transaction);
            await _context.SaveChangesAsync();

            return transaction.TransactionID;
        }

        [Fact(DisplayName = "UTCID01 - Non-owner role should throw UnauthorizedAccessException")]
        public async System.Threading.Tasks.Task UTCID01_NonOwnerRole_ThrowsUnauthorized()
        {
            // Arrange
            SeedHttpContext("dentist");
            var command = new ApproveTransactionCommand
            {
                TransactionId = 1,
                Action = true
            };

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, CancellationToken.None));
        }

        [Fact(DisplayName = "UTCID02 - Transaction not found should throw Exception")]
        public async System.Threading.Tasks.Task UTCID02_TransactionNotFound_ThrowsException()
        {
            // Arrange
            SeedHttpContext("owner");
            var command = new ApproveTransactionCommand
            {
                TransactionId = 999,
                Action = true
            };

            // Act & Assert
            await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(command, CancellationToken.None));
        }

        [Fact(DisplayName = "UTCID03 - Transaction not pending should throw Exception")]
        public async System.Threading.Tasks.Task UTCID03_TransactionNotPending_ThrowsException()
        {
            // Arrange
            SeedHttpContext("owner");
            var transactionId = await SeedTransactionAsync(status: "approved");

            var command = new ApproveTransactionCommand
            {
                TransactionId = transactionId,
                Action = true
            };

            // Act & Assert
            await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(command, CancellationToken.None));
        }

        [Fact(DisplayName = "UTCID04 - Approve pending transaction should update and return true")]
        public async System.Threading.Tasks.Task UTCID04_ApprovePendingTransaction_ReturnsTrue()
        {
            // Arrange
            SeedHttpContext("owner", 99);
            var transactionId = await SeedTransactionAsync("pending", true);

            var command = new ApproveTransactionCommand
            {
                TransactionId = transactionId,
                Action = true // approve
            };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result);

            var updated = await _context.FinancialTransactions.FirstAsync(t => t.TransactionID == transactionId);
            Assert.Equal("approved", updated.status);
            Assert.Equal(99, updated.UpdatedBy);
            Assert.True(updated.UpdatedAt.HasValue);
        }

        [Fact(DisplayName = "UTCID05 - Reject pending transaction should update and return true")]
        public async System.Threading.Tasks.Task UTCID05_RejectPendingTransaction_ReturnsTrue()
        {
            // Arrange
            SeedHttpContext("owner", 55);
            var transactionId = await SeedTransactionAsync("pending", false);

            var command = new ApproveTransactionCommand
            {
                TransactionId = transactionId,
                Action = false // reject
            };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result);

            var updated = await _context.FinancialTransactions.FirstAsync(t => t.TransactionID == transactionId);
            Assert.Equal("rejected", updated.status);
            Assert.Equal(55, updated.UpdatedBy);
        }
    }
}
