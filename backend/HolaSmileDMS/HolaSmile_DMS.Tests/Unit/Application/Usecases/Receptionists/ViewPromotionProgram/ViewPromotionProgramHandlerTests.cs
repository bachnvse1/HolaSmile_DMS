using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Receptionist.ViewPromotionProgram;
using Domain.Entities;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Receptionists
{
    public class ViewPromotionProgramHandlerTests
    {
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly Mock<IPromotionRepository> _promotionRepoMock = new();

        private readonly ViewPromotionProgramHandler _handler;

        public ViewPromotionProgramHandlerTests()
        {
            _handler = new ViewPromotionProgramHandler(
                _httpContextAccessorMock.Object,
                _promotionRepoMock.Object,
                Mock.Of<IProcedureRepository>() // Không dùng trong handler nhưng bắt buộc trong constructor
            );
        }

        private void SetupHttpContext(string role = "receptionist", string userId = "1")
        {
            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Role, role)
        }, "mock"));

            _httpContextAccessorMock.Setup(x => x.HttpContext!.User).Returns(user);
        }

        [Fact(DisplayName = "UTCID01 - Return empty list when no promotion found")]
        public async System.Threading.Tasks.Task UTCID01_ReturnEmptyList_WhenNoneExist()
        {
            SetupHttpContext("receptionist");

            _promotionRepoMock.Setup(x => x.GetAllPromotionProgramsAsync())
                .ReturnsAsync((List<DiscountProgram>)null!); // or new List<DiscountProgram>()

            var result = await _handler.Handle(new ViewPromotionProgramCommand(), CancellationToken.None);

            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact(DisplayName = "UTCID02 - Return list of promotions when available")]
        public async System.Threading.Tasks.Task UTCID02_ReturnPromotionList_WhenAvailable()
        {
            SetupHttpContext("owner");

            var promoList = new List<DiscountProgram>
        {
            new DiscountProgram { DiscountProgramID = 1, DiscountProgramName = "Promo 1" },
            new DiscountProgram { DiscountProgramID = 2, DiscountProgramName = "Promo 2" }
        };

            _promotionRepoMock.Setup(x => x.GetAllPromotionProgramsAsync()).ReturnsAsync(promoList);

            var result = await _handler.Handle(new ViewPromotionProgramCommand(), CancellationToken.None);

            result.Should().NotBeNull();
            result.Should().HaveCount(2);
            result.Should().Contain(p => p.DiscountProgramName == "Promo 1");
        }
    }

}
