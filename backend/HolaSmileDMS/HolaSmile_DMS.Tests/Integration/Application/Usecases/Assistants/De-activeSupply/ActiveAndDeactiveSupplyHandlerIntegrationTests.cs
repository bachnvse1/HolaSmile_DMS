
using Application.Constants;
using Application.Usecases.Assistant.DeleteAndUndeleteSupply;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants
{
    public class DeleteAndUndeleteSupplyHandlerIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly DeleteAndUndeleteSupplyHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public DeleteAndUndeleteSupplyHandlerIntegrationTests()
        {
            var services = new ServiceCollection();
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("TestDb_DeleteAndUndeleteSupply"));

            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            SeedData();

            _handler = new DeleteAndUndeleteSupplyHandler(
                _httpContextAccessor,
                new SupplyRepository(_context)
            );
        }

        private void SeedData()
        {
            _context.Users.RemoveRange(_context.Users);
            _context.Supplies.RemoveRange(_context.Supplies);
            _context.SaveChanges();

            _context.Users.AddRange(
                new User { UserID = 1, Username = "0111111111", Fullname = "Assistant A", Phone = "0111111111" },
                new User { UserID = 2, Username = "0111111112", Fullname = "Dentist B", Phone = "0111111112" }
            );

            _context.Supplies.AddRange(
                new Supplies
                {
                    SupplyId = 1,
                    Name = "Găng tay",
                    Unit = "Hộp",
                    QuantityInStock = 50,
                    Price = 10000,
                    IsDeleted = false,
                    CreatedBy = 1,
                    CreatedAt = DateTime.UtcNow
                },
                new Supplies
                {
                    SupplyId = 2,
                    Name = "Khẩu trang",
                    Unit = "Hộp",
                    QuantityInStock = 100,
                    Price = 5000,
                    IsDeleted = true,
                    CreatedBy = 1,
                    CreatedAt = DateTime.UtcNow
                }
            );

            _context.SaveChanges();
        }

        private void SetupHttpContext(string role, int userId)
        {
            var context = new DefaultHttpContext();
            context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        }, "TestAuth"));

            _httpContextAccessor.HttpContext = context;
        }

        [Fact(DisplayName = "ITCID01 - Assistant toggles IsDeleted from false to true")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task ITCID01_Toggle_To_Deleted()
        {
            SetupHttpContext("assistant", 1);

            var result = await _handler.Handle(new DeleteAndUndeleteSupplyCommand { SupplyId = 1 }, default);

            Assert.True(result);
            var updated = await _context.Supplies.FindAsync(1);
            Assert.True(updated.IsDeleted);
            Assert.Equal(1, updated.UpdatedBy);
        }

        [Fact(DisplayName = "ITCID02 - Assistant toggles IsDeleted from true to false")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task ITCID02_Toggle_To_Undeleted()
        {
            SetupHttpContext("assistant", 1);

            var result = await _handler.Handle(new DeleteAndUndeleteSupplyCommand { SupplyId = 2 }, default);

            Assert.True(result);
            var updated = await _context.Supplies.FindAsync(2);
            Assert.False(updated.IsDeleted);
            Assert.Equal(1, updated.UpdatedBy);
        }

        [Fact(DisplayName = "ITCID03 - Unauthorized role throws exception")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task ITCID03_WrongRole_Throws()
        {
            SetupHttpContext("dentist", 2);

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new DeleteAndUndeleteSupplyCommand { SupplyId = 1 }, default));

            Assert.Equal("Bạn không có quyền truy cập chức năng này", ex.Message);
        }

        [Fact(DisplayName = "ITCID04 - Missing authentication throws")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task ITCID04_Missing_Auth_Throws()
        {
            _httpContextAccessor.HttpContext = new DefaultHttpContext(); // no claims

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new DeleteAndUndeleteSupplyCommand { SupplyId = 1 }, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "ITCID05 - Supply not found throws MSG16")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task ITCID05_Supply_NotFound_Throws()
        {
            SetupHttpContext("assistant", 1);

            var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
                _handler.Handle(new DeleteAndUndeleteSupplyCommand { SupplyId = 999 }, default));

            Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
        }
    }
}
