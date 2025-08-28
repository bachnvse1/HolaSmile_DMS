using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.EditSupply;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants
{
    public class EditSupplyHandlerTests
    {
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly Mock<ISupplyRepository> _supplyRepositoryMock;
        private readonly EditSupplyHandler _handler;

        public EditSupplyHandlerTests()
        {
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _supplyRepositoryMock = new Mock<ISupplyRepository>();
            _handler = new EditSupplyHandler(_httpContextAccessorMock.Object, _supplyRepositoryMock.Object);
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

        private EditSupplyCommand CreateValidCommand() => new()
        {
            SupplyId = 1,
            SupplyName = "Gloves",
            Unit = "Box",
            Price = 15.5m,
        };

        [Fact(DisplayName = "Normal - UTCID01 - Valid input should return true")]
        public async System.Threading.Tasks.Task UTCID01_ValidInput_ReturnsTrue()
        {
            SetupHttpContext("assistant", "1");

            var command = CreateValidCommand();
            _supplyRepositoryMock.Setup(r => r.GetSupplyBySupplyIdAsync(command.SupplyId))
                .ReturnsAsync(new Supplies());
            _supplyRepositoryMock.Setup(r => r.EditSupplyAsync(It.IsAny<Supplies>()))
                .ReturnsAsync(true);

            var result = await _handler.Handle(command, default);

            Assert.True(result);
        }

        [Fact(DisplayName = "Unauthorized - UTCID02 - User is not assistant")]
        public async System.Threading.Tasks.Task UTCID02_NotAssistant_ThrowsUnauthorized()
        {
            SetupHttpContext("receptionist", "1");
            var command = CreateValidCommand();

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
            Assert.Equal("Bạn không có quyền truy cập chức năng này", ex.Message);
        }

        [Fact(DisplayName = "Invalid - UTCID03 - SupplyName is empty")]
        public async System.Threading.Tasks.Task UTCID03_SupplyNameEmpty_ThrowsException()
        {
            SetupHttpContext("assistant", "1");
            var command = CreateValidCommand();
            command.SupplyName = "";

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _handler.Handle(command, default));
            Assert.Equal("Vui lòng nhập thông tin bắt buộc", ex.Message);
        }

        [Fact(DisplayName = "Invalid - UTCID04 - Unit is empty")]
        public async System.Threading.Tasks.Task UTCID04_UnitEmpty_ThrowsException()
        {
            SetupHttpContext("assistant", "1");
            var command = CreateValidCommand();
            command.Unit = " ";

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _handler.Handle(command, default));
            Assert.Equal("Vui lòng nhập thông tin bắt buộc", ex.Message);
        }


        [Fact(DisplayName = "Invalid - UTCID06 - Price <= 0")]
        public async System.Threading.Tasks.Task UTCID06_PriceInvalid_ThrowsException()
        {
            SetupHttpContext("assistant", "1");
            var command = CreateValidCommand();
            command.Price = 0;

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _handler.Handle(command, default));
            Assert.Equal("Giá không được nhỏ hơn 0", ex.Message);
        }

        [Fact(DisplayName = "Invalid - UTCID07 - Price <= 0")]
        public async System.Threading.Tasks.Task UTCID07_PriceInvalid_ThrowsException()
        {
            SetupHttpContext("assistant", "1");
            var command = CreateValidCommand();
            command.Price = 0;

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _handler.Handle(command, default));
            Assert.Equal("Giá không được nhỏ hơn 0", ex.Message);
        }


        [Fact(DisplayName = "Invalid - UTCID08 - Supply does not exist")]
        public async System.Threading.Tasks.Task UTCID08_SupplyNotFound_ThrowsException()
        {
            SetupHttpContext("assistant", "1");
            var command = CreateValidCommand();

            _supplyRepositoryMock.Setup(r => r.GetSupplyBySupplyIdAsync(command.SupplyId)).ReturnsAsync((Supplies)null);

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG16, ex.Message); // "Không tìm thấy dữ liệu"
        }

        [Fact(DisplayName = "Error - UTCID09 - Edit fails returns false")]
        public async System.Threading.Tasks.Task UTCID09_RepositoryEditFails_ReturnsFalse()
        {
            SetupHttpContext("assistant", "1");
            var command = CreateValidCommand();

            _supplyRepositoryMock.Setup(r => r.GetSupplyBySupplyIdAsync(command.SupplyId)).ReturnsAsync(new Supplies());
            _supplyRepositoryMock.Setup(r => r.EditSupplyAsync(It.IsAny<Supplies>())).ReturnsAsync(false);

            var result = await _handler.Handle(command, default);
            Assert.False(result);
        }

        [Fact(DisplayName = "Invalid - UTCID10 - SupplyId không tồn tại")]
        public async System.Threading.Tasks.Task UTCID10_SupplyIdNotFound_ThrowsException()
        {
            SetupHttpContext("assistant", "1");

            var command = new EditSupplyCommand
            {
                SupplyId = 999,
                SupplyName = "Mask",
                Unit = "Box",
                Price = 1000,
            };

            _supplyRepositoryMock.Setup(r => r.GetSupplyBySupplyIdAsync(command.SupplyId)).ReturnsAsync((Supplies)null);

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
        }
    }
}
