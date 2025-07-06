using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.UserCommon.ViewSupplies;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.UserCommon
{
    public class ViewDetailSupplyHandlerTests
    {
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly Mock<IUserCommonRepository> _userCommonRepositoryMock;
        private readonly Mock<ISupplyRepository> _supplyRepositoryMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly ViewDetailSupplyHandler _handler;

        public ViewDetailSupplyHandlerTests()
        {
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _userCommonRepositoryMock = new Mock<IUserCommonRepository>();
            _supplyRepositoryMock = new Mock<ISupplyRepository>();
            _mapperMock = new Mock<IMapper>();

            _handler = new ViewDetailSupplyHandler(
                _httpContextAccessorMock.Object,
                _userCommonRepositoryMock.Object,
                _supplyRepositoryMock.Object,
                _mapperMock.Object);
        }

        private void SetupHttpContext(string role, string userId = "1")
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Role, role)
            };
            var identity = new ClaimsIdentity(claims, "mock");
            var user = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = user };
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);
        }

        [Fact(DisplayName = "Normal - UTCID01 - Assistant can view deleted supply")]
        public async System.Threading.Tasks.Task UTCID01_Assistant_ViewDeletedSupply_Success()
        {
            SetupHttpContext("assistant", "1");
            var supply = new Supplies
            {
                SupplyId = 1,
                IsDeleted = true,
                CreatedBy = 10,
                UpdatedBy = 20
            };

            _supplyRepositoryMock.Setup(r => r.GetSupplyBySupplyIdAsync(1)).ReturnsAsync(supply);
            _userCommonRepositoryMock.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(new User { Fullname = "Creator" });
            _userCommonRepositoryMock.Setup(r => r.GetByIdAsync(20, It.IsAny<CancellationToken>())).ReturnsAsync(new User { Fullname = "Updater" });

            _mapperMock.Setup(m => m.Map<SuppliesDTO>(supply)).Returns(new SuppliesDTO());

            var result = await _handler.Handle(new ViewDetailSupplyCommand { SupplyId = 1 }, CancellationToken.None);

            Assert.NotNull(result);
            Assert.Equal("Creator", result.CreatedBy);
            Assert.Equal("Updater", result.UpdateBy);
        }

        [Fact(DisplayName = "Normal - UTCID02 - Non-assistant can only view active supply")]
        public async System.Threading.Tasks.Task UTCID02_NonAssistant_ViewActiveSupply_Success()
        {
            SetupHttpContext("dentist", "1");
            var supply = new Supplies
            {
                SupplyId = 2,
                IsDeleted = false,
                CreatedBy = 11,
                UpdatedBy = 21
            };

            _supplyRepositoryMock.Setup(r => r.GetSupplyBySupplyIdAsync(2)).ReturnsAsync(supply);
            _userCommonRepositoryMock.Setup(r => r.GetByIdAsync(11, It.IsAny<CancellationToken>())).ReturnsAsync(new User { Fullname = "Creator2" });
            _userCommonRepositoryMock.Setup(r => r.GetByIdAsync(21, It.IsAny<CancellationToken>())).ReturnsAsync(new User { Fullname = "Updater2" });

            _mapperMock.Setup(m => m.Map<SuppliesDTO>(supply)).Returns(new SuppliesDTO());

            var result = await _handler.Handle(new ViewDetailSupplyCommand { SupplyId = 2 }, CancellationToken.None);

            Assert.Equal("Creator2", result.CreatedBy);
            Assert.Equal("Updater2", result.UpdateBy);
        }

        [Fact(DisplayName = "Invalid - UTCID03 - Non-assistant cannot view deleted supply")]
        public async System.Threading.Tasks.Task UTCID03_NonAssistant_ViewDeletedSupply_ThrowsException()
        {
            SetupHttpContext("receptionist", "1");
            var supply = new Supplies
            {
                SupplyId = 3,
                IsDeleted = true
            };

            _supplyRepositoryMock.Setup(r => r.GetSupplyBySupplyIdAsync(3)).ReturnsAsync(supply);

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(new ViewDetailSupplyCommand { SupplyId = 3 }, CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
        }

        [Fact(DisplayName = "Invalid - UTCID04 - Supply not found")]
        public async System.Threading.Tasks.Task UTCID04_SupplyNotFound_ThrowsException()
        {
            SetupHttpContext("assistant", "1");
            _supplyRepositoryMock.Setup(r => r.GetSupplyBySupplyIdAsync(99)).ReturnsAsync((Supplies)null);

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(new ViewDetailSupplyCommand { SupplyId = 99 }, CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
        }

        [Fact(DisplayName = "Unauthorized - UTCID05 - Role is null")]
        public async System.Threading.Tasks.Task UTCID05_RoleMissing_ThrowsUnauthorized()
        {
            var claims = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, "1") };
            var identity = new ClaimsIdentity(claims, "mock");
            var user = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = user };
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(new ViewDetailSupplyCommand { SupplyId = 1 }, CancellationToken.None));
            Assert.Equal("Bạn không có quyền truy cập chức năng này", ex.Message);
        }

        [Fact(DisplayName = "Edge - UTCID06 - CreatedBy/UpdatedBy user not found")]
        public async System.Threading.Tasks.Task UTCID06_UnknownUsers_FallbackToUnknown()
        {
            SetupHttpContext("assistant", "1");

            var supply = new Supplies
            {
                SupplyId = 10,
                CreatedBy = 100,
                UpdatedBy = 200
            };

            _supplyRepositoryMock.Setup(r => r.GetSupplyBySupplyIdAsync(10)).ReturnsAsync(supply);
            _userCommonRepositoryMock.Setup(r => r.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
                                     .ReturnsAsync((User)null);

            _mapperMock.Setup(m => m.Map<SuppliesDTO>(supply)).Returns(new SuppliesDTO());

            var result = await _handler.Handle(new ViewDetailSupplyCommand { SupplyId = 10 }, CancellationToken.None);

            Assert.Equal("Unknown", result.CreatedBy);
            Assert.Equal("Unknown", result.UpdateBy);
        }
    }
}
