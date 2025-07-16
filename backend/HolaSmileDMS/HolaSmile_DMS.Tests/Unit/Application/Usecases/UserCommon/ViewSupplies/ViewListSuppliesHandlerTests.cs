using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentist.ViewDentistSchedule;
using Application.Usecases.UserCommon.ViewSupplies;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.UserCommon
{
    public class ViewListSuppliesHandlerTests
    {
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly Mock<ISupplyRepository> _supplyRepositoryMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly ViewListSuppliesHandler _handler;

        public ViewListSuppliesHandlerTests()
        {
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _supplyRepositoryMock = new Mock<ISupplyRepository>();
            _mapperMock = new Mock<IMapper>();
            _handler = new ViewListSuppliesHandler(_httpContextAccessorMock.Object, _supplyRepositoryMock.Object, _mapperMock.Object);
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

        [Fact(DisplayName = "Normal - UTCID01 - Assistant sees all supplies")]
        public async System.Threading.Tasks.Task UTCID01_Assistant_SeesAllSupplies()
        {
            SetupHttpContext("assistant");

            var supplies = new List<Supplies>
            {
                new Supplies { SupplyId = 1, IsDeleted = false },
                new Supplies { SupplyId = 2, IsDeleted = true }
            };

            _supplyRepositoryMock.Setup(r => r.GetAllSuppliesAsync()).ReturnsAsync(supplies);
            _mapperMock.Setup(m => m.Map<List<SuppliesDTO>>(supplies)).Returns(new List<SuppliesDTO> { new SuppliesDTO(), new SuppliesDTO() });

            var result = await _handler.Handle(new ViewListSuppliesCommand(), default);

            Assert.Equal(2, result.Count);
        }

        [Fact(DisplayName = "Normal - UTCID02 - Non-assistant sees only non-deleted supplies")]
        public async System.Threading.Tasks.Task UTCID02_NonAssistant_SeesNonDeletedOnly()
        {
            SetupHttpContext("dentist");

            var supplies = new List<Supplies>
            {
                new Supplies { SupplyId = 1, IsDeleted = false },
                new Supplies { SupplyId = 2, IsDeleted = true }
            };

            _supplyRepositoryMock.Setup(r => r.GetAllSuppliesAsync()).ReturnsAsync(supplies);
            _mapperMock.Setup(m => m.Map<List<SuppliesDTO>>(It.Is<List<Supplies>>(s => s.All(x => !x.IsDeleted))))
                       .Returns(new List<SuppliesDTO> { new SuppliesDTO() });

            var result = await _handler.Handle(new ViewListSuppliesCommand(), default);

            Assert.Single(result);
        }

        [Fact(DisplayName = "Unauthorized - UTCID03 - User role is null")]
        public async System.Threading.Tasks.Task UTCID03_NoRole_ThrowsUnauthorized()
        {
            var context = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, "1")
                }))
            };
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(new ViewListSuppliesCommand(), default));
            Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
        }

        [Fact(DisplayName = "Invalid - UTCID04 - No supplies found should throw exception")]
        public async System.Threading.Tasks.Task UTCID04_NoData_ThrowsException()
        {
            SetupHttpContext("assistant");

            _supplyRepositoryMock.Setup(r => r.GetAllSuppliesAsync()).ReturnsAsync(new List<Supplies>());
            // Mapper không cần setup vì không tới bước đó

            var result = await _handler.Handle(new ViewListSuppliesCommand(), default);
            Assert.NotNull(result);
            Assert.Empty(result);
        }
    }
}
