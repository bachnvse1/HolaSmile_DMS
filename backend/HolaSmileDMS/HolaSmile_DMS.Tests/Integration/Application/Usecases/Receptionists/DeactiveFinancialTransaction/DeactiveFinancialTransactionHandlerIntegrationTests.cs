//using Application.Constants;
//using Application.Interfaces;
//using Application.Usecases.Receptionist.DeactiveFinancialTransaction;
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
//    public class DeactiveFinancialTransactionHandlerIntegrationTests
//    {
//        private readonly ApplicationDbContext _context;
//        private readonly ITransactionRepository _transactionRepository;
//        private readonly IOwnerRepository _ownerRepository;
//        private readonly Mock<IMediator> _mediatorMock;
//        private readonly IHttpContextAccessor _httpContextAccessor;

//        public DeactiveFinancialTransactionHandlerIntegrationTests()
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
//                Category = "Dịch vụ",
//                PaymentMethod = true,
//                CreatedBy = 1,
//                CreatedAt = DateTime.Now,
//                IsDelete = false
//            });

//            _context.SaveChanges();
//        }

//        [Fact(DisplayName = "ITCID01 - Should deactive transaction successfully")]
//        public async System.Threading.Tasks.Task ITCID01_DeactiveTransaction_Success()
//        {
//            // Arrange
//            var handler = new DeactiveFinancialTransactionHandler(
//                _transactionRepository,
//                _httpContextAccessor,
//                _ownerRepository,
//                _mediatorMock.Object
//            );

//            var command = new DeactiveFinancialTransactionCommand(10);

//            // Act
//            var result = await handler.Handle(command, default);

//            // Assert
//            Assert.True(result);
//            var updated = await _context.FinancialTransactions.FindAsync(10);
//            Assert.True(updated.IsDelete);
//        }

//        [Fact(DisplayName = "ITCID02 - Should throw if role is invalid")]
//        public async System.Threading.Tasks.Task ITCID02_InvalidRole_Throws()
//        {
//            _httpContextAccessor.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
//            {
//                new Claim(ClaimTypes.NameIdentifier, "1"),
//                new Claim(ClaimTypes.Role, "patient")
//            }, "TestAuth"));

//            var handler = new DeactiveFinancialTransactionHandler(
//                _transactionRepository,
//                _httpContextAccessor,
//                _ownerRepository,
//                _mediatorMock.Object
//            );

//            var command = new DeactiveFinancialTransactionCommand(10);

//            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(command, default));
//            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
//        }

//        [Fact(DisplayName = "ITCID03 - Should throw if transaction not found")]
//        public async System.Threading.Tasks.Task ITCID03_TransactionNotFound_Throws()
//        {
//            var handler = new DeactiveFinancialTransactionHandler(
//                _transactionRepository,
//                _httpContextAccessor,
//                _ownerRepository,
//                _mediatorMock.Object
//            );

//            var command = new DeactiveFinancialTransactionCommand(999);

//            var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, default));
//            Assert.Equal(MessageConstants.MSG.MSG127, ex.Message);
//        }

//        [Fact(DisplayName = "ITCID04 - Should allow owner to deactive transaction")]
//        public async System.Threading.Tasks.Task ITCID04_OwnerCanDeactive_Success()
//        {
//            _httpContextAccessor.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
//            {
//                new Claim(ClaimTypes.NameIdentifier, "2"),
//                new Claim(ClaimTypes.Role, "owner")
//            }, "TestAuth"));

//            var handler = new DeactiveFinancialTransactionHandler(
//                _transactionRepository,
//                _httpContextAccessor,
//                _ownerRepository,
//                _mediatorMock.Object
//            );

//            var command = new DeactiveFinancialTransactionCommand(10);

//            var result = await handler.Handle(command, default);
//            Assert.True(result);

//            var updated = await _context.FinancialTransactions.FindAsync(10);
//            Assert.True(updated.IsDelete);
//        }

//        [Fact(DisplayName = "ITCID05 - Should toggle back to active if already deleted")]
//        public async System.Threading.Tasks.Task ITCID05_ToggleActive_Success()
//        {
//            var existing = await _context.FinancialTransactions.FindAsync(10);
//            existing.IsDelete = true;
//            _context.SaveChanges();

//            var handler = new DeactiveFinancialTransactionHandler(
//                _transactionRepository,
//                _httpContextAccessor,
//                _ownerRepository,
//                _mediatorMock.Object
//            );

//            var command = new DeactiveFinancialTransactionCommand(10);

//            var result = await handler.Handle(command, default);
//            Assert.True(result);

//            var updated = await _context.FinancialTransactions.FindAsync(10);
//            Assert.False(updated.IsDelete);
//        }
//    }
//}
