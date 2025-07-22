using Application.Usecases.Receptionist.ViewFinancialTransactions;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using Xunit;
using Domain.Entities;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Application.Constants;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Receptionists
{
    public class ViewFinancialTransactionsCommandHandlerIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly TransactionRepository _transactionRepo;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ViewFinancialTransactionsCommandHandlerIntegrationTests()
        {
            var services = new ServiceCollection();
            services.AddMemoryCache();

            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase($"ViewFinancialTransactionsTest_{Guid.NewGuid()}")
                .Options;

            var provider = services.BuildServiceProvider();
            var memoryCache = provider.GetRequiredService<IMemoryCache>();

            _context = new ApplicationDbContext(options);
            _transactionRepo = new TransactionRepository(_context);
            _httpContextAccessor = new HttpContextAccessor();

            SeedData();
        }

        private void SeedData()
        {
            _context.Users.AddRange(
                new User { UserID = 1, Username = "0111111111", Fullname = "Receptionist A", Phone = "0111111111" },
                new User { UserID = 2, Username = "0111111112", Fullname = "Owner B", Phone = "0111111112" },
                new User { UserID = 3, Username = "0111111113", Fullname = "Patient C", Phone = "0111111113" }
            );

            _context.FinancialTransactions.AddRange(
                new FinancialTransaction
                {
                    TransactionID = 1,
                    TransactionDate = DateTime.Today,
                    TransactionType = true,
                    Category = "Dịch vụ",
                    PaymentMethod = true,
                    Amount = 1000000,
                    Description = "Thu tiền dịch vụ"
                },
                new FinancialTransaction
                {
                    TransactionID = 2,
                    TransactionDate = DateTime.Today,
                    TransactionType = false,
                    Category = "Mua vật tư",
                    PaymentMethod = false,
                    Amount = 500000,
                    Description = "Chi tiền mua vật tư"
                }
            );

            _context.SaveChanges();
        }

        private void SetupHttpContext(string role, int userId)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);
            _httpContextAccessor.HttpContext = new DefaultHttpContext
            {
                User = principal
            };
        }

        [Fact(DisplayName = "ITCID01: Return all transactions for receptionist")]
        public async System.Threading.Tasks.Task ITCID01_ReturnAllTransactions_Receptionist()
        {
            // Arrange
            SetupHttpContext("receptionist", 1);
            var handler = new ViewFinancialTransactionsCommandHandler(_transactionRepo, _httpContextAccessor);
            var command = new ViewFinancialTransactionsCommand();

            // Act
            var result = await handler.Handle(command, default);

            // Assert
            Assert.Equal(2, result.Count);
            Assert.Contains(result, t => t.Description == "Thu tiền dịch vụ");
            Assert.Contains(result, t => t.Description == "Chi tiền mua vật tư");
        }

        [Fact(DisplayName = "ITCID02: Return all transactions for owner")]
        public async System.Threading.Tasks.Task ITCID02_ReturnAllTransactions_Owner()
        {
            // Arrange
            SetupHttpContext("owner", 2);
            var handler = new ViewFinancialTransactionsCommandHandler(_transactionRepo, _httpContextAccessor);
            var command = new ViewFinancialTransactionsCommand();

            // Act
            var result = await handler.Handle(command, default);

            // Assert
            Assert.Equal(2, result.Count);
        }

        [Fact(DisplayName = "ITCID03: Throw exception for unauthorized role")]
        public async System.Threading.Tasks.Task ITCID03_ThrowException_Unauthorized()
        {
            // Arrange
            SetupHttpContext("patient", 3);
            var handler = new ViewFinancialTransactionsCommandHandler(_transactionRepo, _httpContextAccessor);
            var command = new ViewFinancialTransactionsCommand();

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "ITCID04: Return empty list when no transactions")]
        public async System.Threading.Tasks.Task ITCID04_ReturnEmptyList_WhenNoTransactions()
        {
            // Arrange
            _context.FinancialTransactions.RemoveRange(_context.FinancialTransactions);
            _context.SaveChanges();
            SetupHttpContext("receptionist", 1);
            var handler = new ViewFinancialTransactionsCommandHandler(_transactionRepo, _httpContextAccessor);
            var command = new ViewFinancialTransactionsCommand();

            // Act
            var result = await handler.Handle(command, default);

            // Assert
            Assert.Empty(result);
        }
    }
}
