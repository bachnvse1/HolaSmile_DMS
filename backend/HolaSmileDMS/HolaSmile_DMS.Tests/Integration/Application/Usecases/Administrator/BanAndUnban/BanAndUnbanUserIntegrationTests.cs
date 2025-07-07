using System.Security.Claims;
using Application.Constants;
using Application.Usecases.administrator.BanAndUnban;
using Application.Usecases.Administrator.BanAndUnban;
using Application.Usecases.Administrator.ViewListUser;
using HDMS_API.Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Administrator.BanAndUnban
{
    public class BanAndUnbanUserIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly BanAndUnbanUserHandle _handler;

        public BanAndUnbanUserIntegrationTests()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("TestDb_BanUnbanUser"));

            services.AddHttpContextAccessor();
            services.AddMemoryCache();

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();
            var memoryCache = provider.GetRequiredService<IMemoryCache>();

            SeedData();

            _handler = new BanAndUnbanUserHandle(
                new UserCommonRepository(_context, new Mock<IEmailService>().Object, memoryCache),
                _httpContextAccessor
            );
        }

        private void SeedData()
        {
            _context.Users.RemoveRange(_context.Users);
            _context.Administrators.RemoveRange(_context.Administrators);
            _context.SaveChanges();

            _context.Users.AddRange(
                new User { UserID = 1, Username = "admin1", Phone = "0900000000", Status = true },
                new User { UserID = 2, Username = "owner1", Phone = "0911111111", Status = true },
                new User { UserID = 3, Username = "targetuser", Phone = "0922222222", Status = true }
            );

            _context.Administrators.Add(new global::Administrator { AdministratorId = 1, UserId = 1 });

            _context.SaveChanges();
        }

        private void SetupHttpContext(string role, int userId)
        {
            var context = new DefaultHttpContext();
            context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        }, "Test"));

            _httpContextAccessor.HttpContext = context;
        }

        [Fact(DisplayName = "[Integration - Normal] Admin Bans and Unbans User Successfully")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task N_Admin_Bans_Unbans_User_Successfully()
        {
            SetupHttpContext("administrator", 1);

            var result = await _handler.Handle(new BanAndUnbanUserCommand
            {
                UserId = 3
            }, default);

            Assert.True(result);
            Assert.False(_context.Users.Find(3)!.Status); // Bị ban

            var result2 = await _handler.Handle(new BanAndUnbanUserCommand
            {
                UserId = 3
            }, default);

            Assert.True(result2);
            Assert.True(_context.Users.Find(3)!.Status); // Unban lại
        }

        [Fact(DisplayName = "[Integration - Abnormal] Admin Provides Invalid UserId")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_Admin_Invalid_UserId()
        {
            SetupHttpContext("administrator", 1);

            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(new BanAndUnbanUserCommand
                {
                    UserId = -1
                }, default));

            Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
        }

        [Fact(DisplayName = "[Integration - Abnormal] Non-Admin Tries To Ban User")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_NonAdmin_Tries_To_Ban()
        {
            SetupHttpContext("owner", 2);

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new BanAndUnbanUserCommand
                {
                    UserId = 3
                }, default));
        }
    }

}
