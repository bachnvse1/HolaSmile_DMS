using Application.Usecases.Assistants.ExcelSupply;
using Application.Interfaces;
using Domain.Entities;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using System.Text;
using Xunit;
using Application.Constants;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants
{
    public class ExportSupplyToExcelHandlerIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly ISupplyRepository _supplyRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ExportSupplyToExcelHandlerIntegrationTests()
        {
            // Setup InMemory Database
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _supplyRepository = new SupplyRepository(_context);

            // Setup HttpContext (Role = Assistant)
            _httpContextAccessor = new HttpContextAccessor
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, "1"),
                        new Claim(ClaimTypes.Role, "assistant")
                    }, "TestAuth"))
                }
            };

            // Seed data
            SeedData();
        }

        private void SeedData()
        {
            _context.Supplies.AddRange(
                new Supplies
                {
                    SupplyId = 1,
                    Name = "Vật tư A",
                    Unit = "Cái",
                    QuantityInStock = 100,
                    Price = 5000,
                    ExpiryDate = DateTime.Now.AddMonths(6),
                    CreatedBy = 1,
                    CreatedAt = DateTime.Now,
                    IsDeleted = false
                },
                new Supplies
                {
                    SupplyId = 2,
                    Name = "Vật tư B",
                    Unit = "Hộp",
                    QuantityInStock = 50,
                    Price = 10000,
                    ExpiryDate = DateTime.Now.AddMonths(3),
                    CreatedBy = 1,
                    CreatedAt = DateTime.Now,
                    IsDeleted = false
                }
            );
            _context.SaveChanges();
        }

        [Fact(DisplayName = "ITCID01 - Should export supplies to Excel successfully")]
        public async System.Threading.Tasks.Task ITCID01_ExportSupplies_SuccessAsync()
        {
            // Arrange
            var handler = new ExportSupplyToExcelHandler(_httpContextAccessor, _supplyRepository);
            var command = new ExportSupplyToExcelCommand();

            // Act
            var result = await handler.Handle(command, default);

            // Assert
            Assert.NotNull(result);
            Assert.True(result.Length > 0);

        }

        [Fact(DisplayName = "ITCID02 - Should throw UnauthorizedAccessException for Administrator role")]
        public async System.Threading.Tasks.Task ITCID02_AdminRole_ThrowsUnauthorizedAsync()
        {
            // Arrange: set role = administrator
            _httpContextAccessor.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "1"),
                new Claim(ClaimTypes.Role, "administrator")
            }, "TestAuth"));

            var handler = new ExportSupplyToExcelHandler(_httpContextAccessor, _supplyRepository);
            var command = new ExportSupplyToExcelCommand();

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "ITCID03 - Should throw UnauthorizedAccessException for Patient role")]
        public async System.Threading.Tasks.Task ITCID03_PatientRole_ThrowsUnauthorizedAsync()
        {
            // Arrange: set role = patient
            _httpContextAccessor.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "1"),
                new Claim(ClaimTypes.Role, "patient")
            }, "TestAuth"));

            var handler = new ExportSupplyToExcelHandler(_httpContextAccessor, _supplyRepository);
            var command = new ExportSupplyToExcelCommand();

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "ITCID04 - Should export empty Excel when no supplies exist")]
        public async System.Threading.Tasks.Task ITCID04_ExportEmptyExcel_WhenNoSuppliesAsync()
        {
            // Arrange: clear all supplies
            _context.Supplies.RemoveRange(_context.Supplies);
            _context.SaveChanges();

            var handler = new ExportSupplyToExcelHandler(_httpContextAccessor, _supplyRepository);
            var command = new ExportSupplyToExcelCommand();

            // Act
            var result = await handler.Handle(command, default);

            // Assert
            Assert.NotNull(result);
            Assert.True(result.Length > 0); // file vẫn tạo ra
        }
    }
}
