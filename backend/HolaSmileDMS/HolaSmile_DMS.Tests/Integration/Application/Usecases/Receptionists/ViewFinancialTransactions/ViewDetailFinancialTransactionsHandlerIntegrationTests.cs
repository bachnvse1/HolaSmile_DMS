using Application.Constants;
using Application.Usecases.Receptionist.ViewFinancialTransactions;
using Domain.Entities;
using HDMS_API.Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Receptionists
{


    public class ViewDetailFinancialTransactionsHandlerIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly TransactionRepository _transactionRepo;
        private readonly UserCommonRepository _userCommonRepo;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ViewDetailFinancialTransactionsHandlerIntegrationTests()
        {
            var services = new ServiceCollection();
            services.AddMemoryCache();
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase($"ViewDetailFinancialTransactionTest_{Guid.NewGuid()}")
                .Options;
            var provider = services.BuildServiceProvider();
            var memoryCache = provider.GetRequiredService<IMemoryCache>();

            _context = new ApplicationDbContext(options);
            _transactionRepo = new TransactionRepository(_context);
            _userCommonRepo = new UserCommonRepository(_context, new Mock<IEmailService>().Object, memoryCache);
            _httpContextAccessor = new HttpContextAccessor();

            SeedData();
        }

        private void SeedData()
        {
            _context.Users.AddRange(
                new User { UserID = 1, Username = "0111111111", Fullname = "Receptionist A", Phone = "0111111111" },
                new User { UserID = 2, Username = "0111111112", Fullname = "Owner B", Phone = "0111111112" }
            );

            _context.FinancialTransactions.Add(new FinancialTransaction
            {
                TransactionID = 100,
                TransactionDate = DateTime.Today,
                TransactionType = true,
                Category = "Thanh toán",
                PaymentMethod = true,
                Amount = 100000,
                Description = "Thu tiền dịch vụ",
                CreatedBy = 1,
                CreatedAt = DateTime.Now,
                UpdatedBy = 2,
                UpdatedAt = DateTime.Now
            });

            _context.SaveChanges();
        }

        private void SetupHttpContext(string role, int userId)
        {
            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role)
        }, "mock"));

            _httpContextAccessor.HttpContext = new DefaultHttpContext
            {
                User = user
            };
        }

        [Fact(DisplayName = "ITCID01: Success - Receptionist views transaction detail")]
        public async System.Threading.Tasks.Task ITCID01_ViewDetail_Success_ReceptionistAsync()
        {
            // Arrange
            SetupHttpContext("receptionist", 1);
            var handler = new ViewDetailFinancialTransactionsHandler(_userCommonRepo, _transactionRepo, _httpContextAccessor);
            var command = new ViewDetailFinancialTransactionsCommand(100);

            // Act
            var result = await handler.Handle(command, default);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(100, result.TransactionID);
            Assert.Equal("Thu", result.TransactionType);
            Assert.Equal("Thanh toán", result.Category);
            Assert.Equal("Tiền mặt", result.PaymentMethod);
            Assert.Equal(100000, result.Amount);
            Assert.Equal("Receptionist A", result.CreateBy);
            Assert.Equal("Owner B", result.UpdateBy);
        }

        [Fact(DisplayName = "ITCID02: Fail - Role not allowed (patient)")]
        public async System.Threading.Tasks.Task ITCID02_ViewDetail_Fail_WrongRoleAsync()
        {
            // Arrange
            SetupHttpContext("patient", 1);
            var handler = new ViewDetailFinancialTransactionsHandler(_userCommonRepo, _transactionRepo, _httpContextAccessor);
            var command = new ViewDetailFinancialTransactionsCommand(100);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "ITCID03: Fail - Not logged in")]
        public async System.Threading.Tasks.Task ITCID03_ViewDetail_Fail_NotLoggedInAsync()
        {
            // Arrange: no HttpContext
            _httpContextAccessor.HttpContext = null;
            var handler = new ViewDetailFinancialTransactionsHandler(_userCommonRepo, _transactionRepo, _httpContextAccessor);
            var command = new ViewDetailFinancialTransactionsCommand(100);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
        }

        [Fact(DisplayName = "ITCID04: Fail - Transaction not found")]
        public async System.Threading.Tasks.Task ITCID04_ViewDetail_Fail_NotFoundAsync()
        {
            // Arrange
            SetupHttpContext("receptionist", 1);
            var handler = new ViewDetailFinancialTransactionsHandler(_userCommonRepo, _transactionRepo, _httpContextAccessor);
            var command = new ViewDetailFinancialTransactionsCommand(999); // not exist

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
        }

        [Fact(DisplayName = "ITCID05: Success - Owner views transaction detail")]
        public async System.Threading.Tasks.Task ITCID05_ViewDetail_Success_OwnerAsync()
        {
            // Arrange
            SetupHttpContext("owner", 2);
            var handler = new ViewDetailFinancialTransactionsHandler(_userCommonRepo, _transactionRepo, _httpContextAccessor);
            var command = new ViewDetailFinancialTransactionsCommand(100);

            // Act
            var result = await handler.Handle(command, default);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(100, result.TransactionID);
        }
    }


}
