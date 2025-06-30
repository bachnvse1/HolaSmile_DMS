using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Application.Interfaces;
using Application.Usecases.administrator.BanAndUnban;
using Application.Usecases.Administrator.BanAndUnban;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Admintrator.BanAndUnbanUser
{
    public class BanAndUnbanUserHandleTests
    {
        private readonly Mock<IUserCommonRepository> _repoMock = new();
        private readonly Mock<IHttpContextAccessor> _httpContext = new();
        private readonly BanAndUnbanUserHandle _handler;

        public BanAndUnbanUserHandleTests()
        {
            _handler = new BanAndUnbanUserHandle(_repoMock.Object, _httpContext.Object);
        }

        private void SetupHttpContext(string role, int userId)
        {
            var claims = new List<Claim>
        {
            new(ClaimTypes.Role, role),
            new(ClaimTypes.NameIdentifier, userId.ToString())
        };

            var identity = new ClaimsIdentity(claims, "Test");
            var context = new DefaultHttpContext { User = new ClaimsPrincipal(identity) };
            _httpContext.Setup(h => h.HttpContext).Returns(context);
        }

        [Fact(DisplayName = "[Unit - Normal] Administrator_Can_Ban_User")]
        public async System.Threading.Tasks.Task UTCID01_Administrator_Can_Ban_User()
        {
            SetupHttpContext("administrator", 1);
            var cmd = new BanAndUnbanUserCommand { UserId = 999 };

            _repoMock.Setup(r => r.UpdateUserStatusAsync(999)).ReturnsAsync(true);

            var result = await _handler.Handle(cmd, default);

            Assert.True(result);
        }

        [Fact(DisplayName = "[Unit - Abnormal] Role_Not_Admin_Throws")]
        public async System.Threading.Tasks.Task UTCID02_Not_Admin_Throws()
        {
            SetupHttpContext("receptionist", 1);
            var cmd = new BanAndUnbanUserCommand { UserId = 999 };

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(cmd, default));
        }

        [Fact(DisplayName = "[Unit - Abnormal] Invalid_UserId_Throws")]
        public async System.Threading.Tasks.Task UTCID03_Invalid_UserId_Throws()
        {
            SetupHttpContext("administrator", 1);
            var cmd = new BanAndUnbanUserCommand { UserId = 0 };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _handler.Handle(cmd, default));
            Assert.Equal("dữ liệu đầu vào không đúng", ex.Message);
        }
    }
}
