//using Application.Usecases.Receptionist.ViewFinancialTransactions;
//using Application.Interfaces;
//using Domain.Entities;
//using HDMS_API.Infrastructure.Persistence;
//using Infrastructure.Repositories;
//using Microsoft.AspNetCore.Http;
//using Microsoft.EntityFrameworkCore;
//using System.Security.Claims;
//using Xunit;
//using System.Text;
//using Application.Constants;

//namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Receptionists
//{
//    public class ExportTransactionToExcelHandlerIntegrationTests
//    {
//        private readonly ApplicationDbContext _context;
//        private readonly ITransactionRepository _transactionRepository;
//        private readonly IHttpContextAccessor _httpContextAccessor;

//        public ExportTransactionToExcelHandlerIntegrationTests()
//        {
//            // Setup InMemory DB
//            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
//                .UseInMemoryDatabase(Guid.NewGuid().ToString())
//                .Options;
//            _context = new ApplicationDbContext(options);

//            // Repository
//            _transactionRepository = new TransactionRepository(_context);

//            // Setup HttpContextAccessor (Role = receptionist)
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

//            // Seed data
//            SeedData();
//        }

//        private void SeedData()
//        {
//            _context.FinancialTransactions.AddRange(
//                new FinancialTransaction
//                {
//                    TransactionID = 1,
//                    TransactionType = true,
//                    Category = "Dịch vụ A",
//                    Description = "Thu tiền dịch vụ A",
//                    Amount = 500000,
//                    PaymentMethod = true,
//                    TransactionDate = DateTime.Now,
//                    CreatedBy = 1,
//                    CreatedAt = DateTime.Now,
//                    IsDelete = false
//                },
//                new FinancialTransaction
//                {
//                    TransactionID = 2,
//                    TransactionType = false,
//                    Category = "Chi phí B",
//                    Description = "Chi mua vật tư B",
//                    Amount = 200000,
//                    PaymentMethod = false,
//                    TransactionDate = DateTime.Now,
//                    CreatedBy = 1,
//                    CreatedAt = DateTime.Now,
//                    IsDelete = false
//                }
//            );
//            _context.SaveChanges();
//        }

//        [Fact(DisplayName = "ITCID01 - Should export financial transactions to Excel successfully")]
//        public async System.Threading.Tasks.Task ITCID01_ExportTransactions_SuccessAsync()
//        {
//            // Arrange
//            var handler = new ExportTransactionToExcelHandler(_httpContextAccessor, _transactionRepository);

//            var command = new ExportTransactionToExcelCommand();

//            // Act
//            var result = await handler.Handle(command, default);

//            // Assert
//            Assert.NotNull(result);
//            Assert.True(result.Length > 0);

//        }

//        [Fact(DisplayName = "ITCID02 - Should throw UnauthorizedAccessException when role is not allowed")]
//        public async System.Threading.Tasks.Task ITCID02_UnauthorizedRole_ThrowsExceptionAsync()
//        {
//            // Arrange
//            _httpContextAccessor.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
//            {
//                new Claim(ClaimTypes.NameIdentifier, "1"),
//                new Claim(ClaimTypes.Role, "patient")
//            }, "TestAuth"));

//            var handler = new ExportTransactionToExcelHandler(_httpContextAccessor, _transactionRepository);

//            var command = new ExportTransactionToExcelCommand();

//            // Act & Assert
//            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(command, default));
//            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
//        }

//        [Fact(DisplayName = "ITCID03 - Should return empty file when no transactions exist")]
//        public async System.Threading.Tasks.Task ITCID03_EmptyTransactions_ExportsEmptyFileAsync()
//        {
//            // Arrange
//            _context.FinancialTransactions.RemoveRange(_context.FinancialTransactions);
//            _context.SaveChanges();

//            var handler = new ExportTransactionToExcelHandler(_httpContextAccessor, _transactionRepository);
//            var command = new ExportTransactionToExcelCommand();

//            // Act
//            var result = await handler.Handle(command, default);

//            // Assert
//            Assert.NotNull(result);
//            Assert.True(result.Length > 0); // File vẫn tạo ra, nhưng không có dữ liệu
//        }
//    }
//}
