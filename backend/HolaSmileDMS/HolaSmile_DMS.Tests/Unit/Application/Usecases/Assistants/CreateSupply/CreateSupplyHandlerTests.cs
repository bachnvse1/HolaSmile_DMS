using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.CreateSupply;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants
{
    public class CreateSupplyHandlerTests
    {
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly Mock<ISupplyRepository> _supplyRepositoryMock;
        private readonly CreateSupplyHandler _handler;

        public CreateSupplyHandlerTests()
        {
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _supplyRepositoryMock = new Mock<ISupplyRepository>();
            _handler = new CreateSupplyHandler(_httpContextAccessorMock.Object, _supplyRepositoryMock.Object);
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

        [Fact(DisplayName = "Normal - UTCID01 - Valid input should return true")]
        public async System.Threading.Tasks.Task UTCID01_ValidInput_ReturnsTrue()
        {
            SetupHttpContext("assistant", "1");
            var command = new CreateSupplyCommand
            {
                SupplyName = "Gauze",
                Unit = "Box",
                QuantityInStock = 10,
                Price = 5.5m,
                ExpiryDate = DateTime.Now.AddDays(30)
            };

            _supplyRepositoryMock.Setup(r => r.CreateSupplyAsync(It.IsAny<Supplies>())).ReturnsAsync(true);

            var result = await _handler.Handle(command, default);
            Assert.True(result);
        }

        [Fact(DisplayName = "Unauthorized - UTCID02 - User is not assistant")]
        public async System.Threading.Tasks.Task UTCID02_NotAssistant_ThrowsUnauthorized()
        {
            SetupHttpContext("receptionist", "1");
            var command = new CreateSupplyCommand();

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "Invalid - UTCID03 - SupplyName is empty")]
        public async System.Threading.Tasks.Task UTCID03_SupplyNameEmpty_ThrowsException()
        {
            SetupHttpContext("assistant", "1");
            var command = new CreateSupplyCommand { SupplyName = "", Unit = "Box", QuantityInStock = 1, Price = 10, ExpiryDate = DateTime.Now.AddDays(1) };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
        }

        [Fact(DisplayName = "Invalid - UTCID04 - Unit is empty")]
        public async System.Threading.Tasks.Task UTCID04_UnitEmpty_ThrowsException()
        {
            SetupHttpContext("assistant", "1");
            var command = new CreateSupplyCommand { SupplyName = "Mask", Unit = "", QuantityInStock = 1, Price = 10, ExpiryDate = DateTime.Now.AddDays(1) };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
        }

        [Fact(DisplayName = "Invalid - UTCID05 - QuantityInStock <= 0")]
        public async System.Threading.Tasks.Task UTCID05_QuantityInvalid_ThrowsException()
        {
            SetupHttpContext("assistant", "1");
            var command = new CreateSupplyCommand { SupplyName = "Mask", Unit = "Box", QuantityInStock = 0, Price = 10, ExpiryDate = DateTime.Now.AddDays(1) };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG94, ex.Message);
        }

        [Fact(DisplayName = "Invalid - UTCID06 - Price <= 0")]
        public async System.Threading.Tasks.Task UTCID06_PriceInvalid_ThrowsException()
        {
            SetupHttpContext("assistant", "1");
            var command = new CreateSupplyCommand { SupplyName = "Mask", Unit = "Box", QuantityInStock = 1, Price = 0, ExpiryDate = DateTime.Now.AddDays(1) };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG95, ex.Message);
        }

        [Fact(DisplayName = "Invalid - UTCID07 - ExpiryDate in past")]
        public async System.Threading.Tasks.Task UTCID07_ExpiryDateInvalid_ThrowsException()
        {
            SetupHttpContext("assistant", "1");
            var command = new CreateSupplyCommand { SupplyName = "Mask", Unit = "Box", QuantityInStock = 1, Price = 10, ExpiryDate = DateTime.Now.AddDays(-1) };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG96, ex.Message);
        }

        [Fact(DisplayName = "Unauthorized - UTCID08 - No HttpContext (null)")]
        public async System.Threading.Tasks.Task UTCID08_NoHttpContext_ThrowsUnauthorized()
        {
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns((HttpContext)null);
            var command = new CreateSupplyCommand();

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "Error - UTCID09 - Repository returns false")]
        public async System.Threading.Tasks.Task UTCID09_RepositoryFails_ReturnsFalse()
        {
            SetupHttpContext("assistant", "1");
            var command = new CreateSupplyCommand
            {
                SupplyName = "Gloves",
                Unit = "Box",
                QuantityInStock = 5,
                Price = 12.5m,
                ExpiryDate = DateTime.Now.AddDays(10)
            };

            _supplyRepositoryMock.Setup(r => r.CreateSupplyAsync(It.IsAny<Supplies>())).ReturnsAsync(false);

            var result = await _handler.Handle(command, default);
            Assert.False(result);
        }
    }
}
