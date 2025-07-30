//using Application.Constants;
//using Application.Interfaces;
//using Application.Usecases.Receptionist.EditFinancialTransaction;
//using Domain.Entities;
//using HDMS_API.Infrastructure.Persistence;
//using Infrastructure.Repositories;
//using MediatR;
//using Microsoft.AspNetCore.Http;
//using Microsoft.EntityFrameworkCore;
//using Microsoft.Extensions.Caching.Memory;
//using Microsoft.Extensions.DependencyInjection;
//using Moq;
//using System.Security.Claims;
//using Xunit;

//namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Receptionists
//{
//    public class EditFinancialTransactionHandlerIntegrationTests
//    {
//        private readonly ApplicationDbContext _context;
//        private readonly ITransactionRepository _transactionRepository;
//        private readonly IOwnerRepository _ownerRepository;
//        private readonly Mock<IMediator> _mediatorMock;
//        private readonly IHttpContextAccessor _httpContextAccessor;

//        public EditFinancialTransactionHandlerIntegrationTests()
//        {
//            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
//                .UseInMemoryDatabase(Guid.NewGuid().ToString())
//                .Options;

//            _context = new ApplicationDbContext(options);
//            _transactionRepository = new TransactionRepository(_context);
//            _ownerRepository = new OwnerRepository(_context);
//            _mediatorMock = new Mock<IMediator>();

//            var services = new ServiceCollection();
//            services.AddMemoryCache();
//            var provider = services.BuildServiceProvider();
//            var memoryCache = provider.GetService<IMemoryCache>();

//            _httpContextAccessor = new HttpContextAccessor
//            {
//                HttpContext = new DefaultHttpContext
//                {
//                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
//                    {
//                        new Claim(ClaimTypes.NameIdentifier, "1"),
//                        new Claim(ClaimTypes.Role, "receptionist")
//                    }, "TestAuth"))
//                }
//            };

//            SeedData();
//        }

//        private void SeedData()
//        {
//            _context.Users.AddRange(
//                new User
//                {
//                    UserID = 1,
//                    Username = "0111111111",
//                    Fullname = "Receptionist A",
//                    Phone = "0111111111"
//                },
//                new User
//                {
//                    UserID = 2,
//                    Username = "0999999999",
//                    Fullname = "Owner B",
//                    Phone = "0999999999"
//                }
//            );

//            _context.Owners.Add(new Owner
//            {
//                OwnerId = 1,
//                UserId = 2
//            });

//            _context.FinancialTransactions.Add(new FinancialTransaction
//            {
//                TransactionID = 10,
//                Description = "Phiếu thu ban đầu",
//                Amount = 300000,
//                TransactionType = true,
//                Category = "Khám bệnh",
//                PaymentMethod = true,
//                TransactionDate = DateTime.Today.AddDays(-2),
//                CreatedBy = 1,
//                CreatedAt = DateTime.Now,
//                IsDelete = false
//            });

//            _context.SaveChanges();
//        }

//        [Fact(DisplayName = "ITCID01 - Should edit transaction successfully")]
//        public async System.Threading.Tasks.Task ITCID01_EditTransaction_Success()
//        {
//            // Arrange
//            var handler = new EditFinancialTransactionHandler(
//                _transactionRepository,
//                _httpContextAccessor,
//                _ownerRepository,
//                _mediatorMock.Object
//            );

//            var command = new EditFinancialTransactionCommand
//            {
//                TransactionId = 10,
//                Description = "Phiếu thu chỉnh sửa",
//                Amount = 500000,
//                TransactionType = false,
//                Category = "Dịch vụ",
//                PaymentMethod = false,
//                TransactionDate = DateTime.Today
//            };

//            // Act
//            var result = await handler.Handle(command, default);

//            // Assert
//            Assert.True(result);

//            var updated = await _context.FinancialTransactions.FindAsync(10);
//            Assert.Equal("Phiếu thu chỉnh sửa", updated.Description);
//            Assert.Equal(500000, updated.Amount);
//            Assert.False(updated.TransactionType);
//        }

//        [Fact(DisplayName = "ITCID02 - Should throw if role is invalid")]
//        public async System.Threading.Tasks.Task ITCID02_InvalidRole_Throws()
//        {
//            _httpContextAccessor.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
//            {
//                new Claim(ClaimTypes.NameIdentifier, "1"),
//                new Claim(ClaimTypes.Role, "patient")
//            }, "TestAuth"));

//            var handler = new EditFinancialTransactionHandler(
//                _transactionRepository,
//                _httpContextAccessor,
//                _ownerRepository,
//                _mediatorMock.Object
//            );

//            var command = new EditFinancialTransactionCommand
//            {
//                TransactionId = 10,
//                Description = "Test",
//                Amount = 100000,
//                TransactionType = true,
//                Category = "Dịch vụ",
//                PaymentMethod = true,
//                TransactionDate = DateTime.Today
//            };

//            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(command, default));
//            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
//        }

//        [Fact(DisplayName = "ITCID03 - Should throw if description is empty")]
//        public async System.Threading.Tasks.Task ITCID03_EmptyDescription_Throws()
//        {
//            var handler = new EditFinancialTransactionHandler(
//                _transactionRepository,
//                _httpContextAccessor,
//                _ownerRepository,
//                _mediatorMock.Object
//            );

//            var command = new EditFinancialTransactionCommand
//            {
//                TransactionId = 10,
//                Description = "   ",
//                Amount = 100000,
//                TransactionType = true,
//                Category = "Khám bệnh",
//                PaymentMethod = true,
//                TransactionDate = DateTime.Today
//            };

//            var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, default));
//            Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
//        }

//        [Fact(DisplayName = "ITCID04 - Should throw if amount <= 0")]
//        public async System.Threading.Tasks.Task ITCID04_InvalidAmount_Throws()
//        {
//            var handler = new EditFinancialTransactionHandler(
//                _transactionRepository,
//                _httpContextAccessor,
//                _ownerRepository,
//                _mediatorMock.Object
//            );

//            var command = new EditFinancialTransactionCommand
//            {
//                TransactionId = 10,
//                Description = "Phiếu thu",
//                Amount = 0,
//                TransactionType = true,
//                Category = "Khám bệnh",
//                PaymentMethod = true,
//                TransactionDate = DateTime.Today
//            };

//            var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, default));
//            Assert.Equal(MessageConstants.MSG.MSG95, ex.Message);
//        }

//        [Fact(DisplayName = "ITCID05 - Should throw if transaction not found")]
//        public async System.Threading.Tasks.Task ITCID05_TransactionNotFound_Throws()
//        {
//            var handler = new EditFinancialTransactionHandler(
//                _transactionRepository,
//                _httpContextAccessor,
//                _ownerRepository,
//                _mediatorMock.Object
//            );

//            var command = new EditFinancialTransactionCommand
//            {
//                TransactionId = 999,
//                Description = "Phiếu thu",
//                Amount = 100000,
//                TransactionType = true,
//                Category = "Khám bệnh",
//                PaymentMethod = true,
//                TransactionDate = DateTime.Today
//            };

//            var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, default));
//            Assert.Equal(MessageConstants.MSG.MSG127, ex.Message);
//        }
//    }
//}

