using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
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
    public class ViewListUserIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly ViewListUserHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ViewListUserIntegrationTests()
        {
            var services = new ServiceCollection();
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("TestDb_ViewListUser"));
            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();
            var memoryCache = provider.GetRequiredService<IMemoryCache>();
            var emailServiceMock = new Mock<IEmailService>();

            SeedData();
            _handler = new ViewListUserHandler(
                new UserCommonRepository(_context, emailServiceMock, memoryCache),
                _httpContextAccessor
            );
        }

        private void SeedData()
        {
            _context.Users.RemoveRange(_context.Users);
            _context.SaveChanges();

            _context.Users.AddRange(
                new User { UserID = 1, Username = "admin1", Phone = "0900000000" },
                new User { UserID = 2, Username = "patient1", Phone = "0911111111" },
                new User { UserID = 3, Username = "dentist1", Phone = "0922222222" }
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
        }, "Test"));
            _httpContextAccessor.HttpContext = context;
        }

        [Fact(DisplayName = "[Integration - Normal] Admin Can View All Users")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task N_Admin_Can_View_All_Users()
        {
            SetupHttpContext("Administrator", 1);

            var result = await _handler.Handle(new ViewListUserCommand(), default);

            Assert.NotNull(result);
            Assert.Equal(3, result.Count); // vì đã seed 3 user
        }

        [Fact(DisplayName = "[Integration - Abnormal] Non-Admin Cannot View Users")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_Non_Admin_Cannot_View_Users()
        {
            SetupHttpContext("Patient", 2);

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new ViewListUserCommand(), default));
        }

        [Fact(DisplayName = "[Integration - Abnormal] Admin Views Empty List")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_Admin_Views_Empty_List()
        {
            _context.Users.RemoveRange(_context.Users);
            _context.SaveChanges();

            SetupHttpContext("Administrator", 1);

            await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(new ViewListUserCommand(), default));
        }
    }

}
