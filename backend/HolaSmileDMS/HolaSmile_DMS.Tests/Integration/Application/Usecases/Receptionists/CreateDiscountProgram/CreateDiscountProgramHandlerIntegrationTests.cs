using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Receptionist.CreateFinancialTransaction;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Receptionist.CreateFinancialTransaction
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
            var memoryCache = provider.GetService<IMemoryCache>();

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
                    Username = "0111111111",
                    Fullname = "Receptionist A",
                    Phone = "0111111111"
                },
                new User
                {
                    UserID = 2,
                    Username = "0999999999",
                    Fullname = "Owner B",
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

        [Fact(DisplayName = "ITCID01 - Should create financial transaction successfully")]
        public async System.Threading.Tasks.Task ITCID01_CreateTransaction_Success()
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
                Category = "Dịch vụ khám",
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

        [Fact(DisplayName = "ITCID02 - Should throw if role is invalid")]
        public async System.Threading.Tasks.Task ITCID02_InvalidRole_Throws()
        {
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
                Description = "Tiền đặt cọc",
                Amount = 100000,
                Category = "Khám",
                PaymentMethod = true,
                TransactionDate = DateTime.Now,
                TransactionType = true
            };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "ITCID03 - Should throw if description is empty")]
        public async System.Threading.Tasks.Task ITCID03_EmptyDescription_Throws()
        {
            var handler = new CreateFinancialTransactionHandler(
                _transactionRepository,
                _httpContextAccessor,
                _ownerRepository,
                _mediatorMock.Object
            );

            var command = new CreateFinancialTransactionCommand
            {
                Description = "   ",
                Amount = 100000,
                Category = "Khám",
                PaymentMethod = true,
                TransactionDate = DateTime.Now,
                TransactionType = true
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
        }

        [Fact(DisplayName = "ITCID04 - Should throw if amount <= 0")]
        public async System.Threading.Tasks.Task ITCID04_InvalidAmount_Throws()
        {
            var handler = new CreateFinancialTransactionHandler(
                _transactionRepository,
                _httpContextAccessor,
                _ownerRepository,
                _mediatorMock.Object
            );

            var command = new CreateFinancialTransactionCommand
            {
                Description = "Chi phí nhỏ",
                Amount = 0,
                Category = "Chi",
                PaymentMethod = false,
                TransactionDate = DateTime.Now,
                TransactionType = false
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG95, ex.Message);
        }

        [Fact(DisplayName = "ITCID05 - Should allow owner to create transaction")]
        public async System.Threading.Tasks.Task ITCID05_OwnerRole_CanCreate()
        {
            _httpContextAccessor.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "2"),
                new Claim(ClaimTypes.Role, "owner")
            }, "TestAuth"));

            var handler = new CreateFinancialTransactionHandler(
                _transactionRepository,
                _httpContextAccessor,
                _ownerRepository,
                _mediatorMock.Object
            );

            var command = new CreateFinancialTransactionCommand
            {
                Description = "Tự tạo",
                Amount = 100000,
                Category = "Khác",
                PaymentMethod = true,
                TransactionDate = DateTime.Now,
                TransactionType = true
            };

            var result = await handler.Handle(command, default);
            Assert.True(result);

            var transaction = _context.FinancialTransactions.FirstOrDefault(t => t.Description == "Tự tạo");
            Assert.NotNull(transaction);
            Assert.Equal(100000, transaction.Amount);
        }
    }
}
