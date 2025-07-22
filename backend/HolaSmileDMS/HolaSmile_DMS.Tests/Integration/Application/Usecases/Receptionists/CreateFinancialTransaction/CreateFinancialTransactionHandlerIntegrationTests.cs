using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Receptionist.CreateFinancialTransaction;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Receptionists
{
    public class CreateFinancialTransactionHandlerIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly ITransactionRepository _transactionRepository;
        private readonly IOwnerRepository _ownerRepository;
        private readonly Mock<IMediator> _mediatorMock;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CreateFinancialTransactionHandlerIntegrationTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _transactionRepository = new TransactionRepository(_context);
            _ownerRepository = new OwnerRepository(_context);
            _mediatorMock = new Mock<IMediator>();

            var services = new ServiceCollection();
            services.AddMemoryCache();
            var provider = services.BuildServiceProvider();

            _httpContextAccessor = new HttpContextAccessor
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, "1"),
                        new Claim(ClaimTypes.Role, "receptionist")
                    }, "TestAuth"))
                }
            };

            SeedData();
        }

        private void SeedData()
        {
            _context.Users.AddRange(
                new User
                {
                    UserID = 1,
                    Fullname = "Receptionist A",
                    Username = "recept1",
                    Phone = "0123456789"
                },
                new User
                {
                    UserID = 2,
                    Fullname = "Owner B",
                    Username = "owner1",
                    Phone = "0999999999"
                }
            );

            _context.Owners.Add(new Owner
            {
                OwnerId = 1,
                UserId = 2
            });

            _context.SaveChanges();
        }

        [Fact(DisplayName = "ITCID01 - Should create financial transaction and send notification")]
        public async System.Threading.Tasks.Task ITCID01_CreateTransaction_SuccessAsync()
        {
            // Arrange
            var handler = new CreateFinancialTransactionHandler(
                _transactionRepository,
                _httpContextAccessor,
                _ownerRepository,
                _mediatorMock.Object
            );

            var command = new CreateFinancialTransactionCommand
            {
                TransactionType = true,
                Description = "Thu tiền dịch vụ",
                Amount = 500000,
                Category = "Khám chữa răng",
                PaymentMethod = true,
                TransactionDate = DateTime.Now
            };

            // Act
            var result = await handler.Handle(command, default);

            // Assert
            Assert.True(result);

            var transaction = _context.FinancialTransactions.FirstOrDefault();
            Assert.NotNull(transaction);
            Assert.Equal("Thu tiền dịch vụ", transaction.Description);
            Assert.Equal(500000, transaction.Amount);
            Assert.False(transaction.IsDelete);
        }

        [Fact(DisplayName = "ITCID02 - Should throw when role is invalid")]
        public async System.Threading.Tasks.Task ITCID02_InvalidRole_ThrowsExceptionAsync()
        {
            // Arrange
            _httpContextAccessor.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "1"),
                new Claim(ClaimTypes.Role, "patient")
            }, "TestAuth"));

            var handler = new CreateFinancialTransactionHandler(
                _transactionRepository,
                _httpContextAccessor,
                _ownerRepository,
                _mediatorMock.Object
            );

            var command = new CreateFinancialTransactionCommand
            {
                Description = "Invalid",
                Amount = 1000,
                Category = "Test",
                PaymentMethod = true,
                TransactionDate = DateTime.Now,
                TransactionType = true
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "ITCID03 - Should throw when Description is empty")]
        public async System.Threading.Tasks.Task ITCID03_EmptyDescription_ThrowsExceptionAsync()
        {
            var handler = new CreateFinancialTransactionHandler(
                _transactionRepository,
                _httpContextAccessor,
                _ownerRepository,
                _mediatorMock.Object
            );

            var command = new CreateFinancialTransactionCommand
            {
                Description = " ",
                Amount = 1000,
                Category = "Test",
                PaymentMethod = true,
                TransactionDate = DateTime.Now,
                TransactionType = true
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
        }

        [Fact(DisplayName = "ITCID04 - Should throw when Amount is zero or negative")]
        public async System.Threading.Tasks.Task ITCID04_InvalidAmount_ThrowsExceptionAsync()
        {
            var handler = new CreateFinancialTransactionHandler(
                _transactionRepository,
                _httpContextAccessor,
                _ownerRepository,
                _mediatorMock.Object
            );

            var command = new CreateFinancialTransactionCommand
            {
                Description = "Test",
                Amount = -10,
                Category = "Test",
                PaymentMethod = true,
                TransactionDate = DateTime.Now,
                TransactionType = true
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG95, ex.Message);
        }
    }
}
