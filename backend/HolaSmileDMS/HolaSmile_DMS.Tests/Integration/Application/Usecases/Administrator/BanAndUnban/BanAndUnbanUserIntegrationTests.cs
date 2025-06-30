using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Application.Usecases.administrator.BanAndUnban;
using Application.Usecases.Administrator.BanAndUnban;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Administrator.BanAndUnban
{
    public class BanAndUnbanUserIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly BanAndUnbanUserHandle _handler;
        private readonly IHttpContextAccessor _httpContext;

        public BanAndUnbanUserIntegrationTests()
        {
            var services = new ServiceCollection();
            services.AddDbContext<ApplicationDbContext>(o => o.UseInMemoryDatabase("TestDb"));
            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContext = provider.GetRequiredService<IHttpContextAccessor>();

            SeedDb(_context);

            _handler = new BanAndUnbanUserHandle(new UserCommonRepository(_context, null, null), _httpContext);
        }

        private void SeedDb(ApplicationDbContext db)
        {
            db.Users.RemoveRange(db.Users);
            db.SaveChanges();

            db.Users.Add(new User
            {
                UserID = 1,
                Fullname = "test",
                Status = true,
                Email = "admin@gmail.com"
            });

            db.SaveChanges();
        }

        private void SetupHttpContext(string role, int userId)
        {
            var identity = new ClaimsIdentity(new[]
            {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        }, "Test");

            _httpContext.HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(identity)
            };
        }

        [Fact(DisplayName = "[Integration - Normal] Admin_Can_Ban_User")]
        public async System.Threading.Tasks.Task ITCID01_Admin_Can_Ban_User()
        {
            SetupHttpContext("administrator", 1);

            var result = await _handler.Handle(new BanAndUnbanUserCommand { UserId = 1 }, default);

            Assert.True(result);
        }

        [Fact(DisplayName = "[Integration - Abnormal] Invalid_UserId_Throws")]
        public async System.Threading.Tasks.Task ITCID02_Invalid_UserId_Throws()
        {
            SetupHttpContext("administrator", 1);

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _handler.Handle(new BanAndUnbanUserCommand { UserId = 0 }, default));
            Assert.Equal("dữ liệu đầu vào không đúng", ex.Message);
        }

        [Fact(DisplayName = "[Integration - Abnormal] User_NotFound_ReturnsFalse")]
        public async System.Threading.Tasks.Task ITCID03_User_NotFound_ReturnsFalse()
        {
            // Arrange
            SetupHttpContext("administrator", 1);

            var command = new BanAndUnbanUserCommand { UserId = 999 }; // UserId không tồn tại

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.False(result); // Giả sử repository trả về false nếu không update được
        }

    }
}
