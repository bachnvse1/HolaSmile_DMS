using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.DeleteAndUndeleteSupply;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants.DeleteAndUndeleteSupply
{
    public class DeleteAndUndeleteSupplyHandlerTests
    {
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly Mock<ISupplyRepository> _supplyRepositoryMock;
        private readonly DeleteAndUndeleteSupplyHandler _handler;

        public DeleteAndUndeleteSupplyHandlerTests()
        {
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _supplyRepositoryMock = new Mock<ISupplyRepository>();
            _handler = new DeleteAndUndeleteSupplyHandler(_httpContextAccessorMock.Object, _supplyRepositoryMock.Object);
        }

        private void SetupHttpContext(string role, string userId)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, userId),
            };
            var identity = new ClaimsIdentity(claims, "mock");
            var user = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = user };
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);
        }

        [Fact(DisplayName = "Normal - UTCID01 - Toggle IsDeleted from false to true")]
        public async System.Threading.Tasks.Task UTCID01_ToggleToDeleted_ReturnsTrue()
        {
            SetupHttpContext("assistant", "99");
            var supply = new Supplies
            {
                SupplyId = 1,
                IsDeleted = false
            };

            _supplyRepositoryMock.Setup(r => r.GetSupplyBySupplyIdAsync(1)).ReturnsAsync(supply);
            _supplyRepositoryMock.Setup(r => r.EditSupplyAsync(It.IsAny<Supplies>())).ReturnsAsync(true);

            var command = new DeleteAndUndeleteSupplyCommand { SupplyId = 1 };
            var result = await _handler.Handle(command, default);

            Assert.True(result);
            Assert.True(supply.IsDeleted);
            Assert.Equal(99, supply.UpdatedBy);
        }

        [Fact(DisplayName = "Normal - UTCID02 - Toggle IsDeleted from true to false")]
        public async System.Threading.Tasks.Task UTCID02_ToggleToUndeleted_ReturnsTrue()
        {
            SetupHttpContext("assistant", "5");
            var supply = new Supplies
            {
                SupplyId = 2,
                IsDeleted = true
            };

            _supplyRepositoryMock.Setup(r => r.GetSupplyBySupplyIdAsync(2)).ReturnsAsync(supply);
            _supplyRepositoryMock.Setup(r => r.EditSupplyAsync(It.IsAny<Supplies>())).ReturnsAsync(true);

            var command = new DeleteAndUndeleteSupplyCommand { SupplyId = 2 };
            var result = await _handler.Handle(command, default);

            Assert.True(result);
            Assert.False(supply.IsDeleted);
            Assert.Equal(5, supply.UpdatedBy);
        }

        [Fact(DisplayName = "Unauthorized - UTCID03 - User is not assistant")]
        public async System.Threading.Tasks.Task UTCID03_NotAssistant_ThrowsUnauthorized()
        {
            SetupHttpContext("owner", "1");
            var command = new DeleteAndUndeleteSupplyCommand { SupplyId = 1 };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
            Assert.Equal("Bạn không có quyền truy cập chức năng này", ex.Message);
        }

        [Fact(DisplayName = "Invalid - UTCID04 - Supply not found")]
        public async System.Threading.Tasks.Task UTCID04_SupplyNotFound_ThrowsException()
        {
            SetupHttpContext("assistant", "1");
            _supplyRepositoryMock.Setup(r => r.GetSupplyBySupplyIdAsync(It.IsAny<int>())).ReturnsAsync((Supplies)null);

            var command = new DeleteAndUndeleteSupplyCommand { SupplyId = 999 };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG16, ex.Message); // "Không tìm thấy dữ liệu"
        }
    }
}
