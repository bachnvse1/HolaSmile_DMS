using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.EditWarrantyCard;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants
{
    public class EditWarrantyCardHandlerTests
    {
        private readonly Mock<IWarrantyCardRepository> _warrantyRepoMock = new();
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly EditWarrantyCardHandler _handler;

        public EditWarrantyCardHandlerTests()
        {
            _handler = new EditWarrantyCardHandler(_warrantyRepoMock.Object, _httpContextAccessorMock.Object);
        }

        private void SetupHttpContext(string? role, string? userId = "10")
        {
            if (role == null)
            {
                _httpContextAccessorMock.Setup(h => h.HttpContext).Returns((HttpContext?)null);
                return;
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, userId ?? "")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = principal };

            _httpContextAccessorMock.Setup(h => h.HttpContext).Returns(context);
        }

        [Fact(DisplayName = "Normal - UTCID01 - Assistant edits warranty card successfully")]
        public async System.Threading.Tasks.Task UTCID01_Edit_Success()
        {
            // Arrange
            SetupHttpContext("Assistant", "99");

            var card = new WarrantyCard
            {
                WarrantyCardID = 1,
                StartDate = new DateTime(2024, 1, 1),
                Duration = 12,
                EndDate = new DateTime(2025, 1, 1),
                Status = true
            };

            _warrantyRepoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(card);

            _warrantyRepoMock.Setup(r => r.UpdateWarrantyCardAsync(It.IsAny<WarrantyCard>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            var command = new EditWarrantyCardCommand
            {
                WarrantyCardId = 1,
                Duration = 24,
                Status = false
            };

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG106, result);
            Assert.Equal(24, card.Duration);
            Assert.Equal(new DateTime(2026, 1, 1), card.EndDate); // 2024-01-01 + 24 months
            Assert.False(card.Status);
            Assert.Equal(99, card.UpdatedBy);
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - HttpContext is null throws MSG17")]
        public async System.Threading.Tasks.Task UTCID02_HttpContext_Null()
        {
            SetupHttpContext(null);

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new EditWarrantyCardCommand { WarrantyCardId = 1, Duration = 12, Status = true }, default));

            Assert.Equal(MessageConstants.MSG.MSG17, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Role is not Assistant throws MSG26")]
        public async System.Threading.Tasks.Task UTCID03_InvalidRole()
        {
            SetupHttpContext("Owner");

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new EditWarrantyCardCommand { WarrantyCardId = 1, Duration = 12, Status = true }, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID04 - WarrantyCard not found throws MSG102")]
        public async System.Threading.Tasks.Task UTCID04_Card_Not_Found()
        {
            SetupHttpContext("Assistant");

            _warrantyRepoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync((WarrantyCard?)null);

            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(new EditWarrantyCardCommand { WarrantyCardId = 1, Duration = 12, Status = true }, default));

            Assert.Equal(MessageConstants.MSG.MSG102, ex.Message);
        }

        [Theory(DisplayName = "Abnormal - UTCID05 - Invalid Duration throws MSG98")]
        [InlineData(null)]
        [InlineData(0)]
        [InlineData(-5)]
        public async System.Threading.Tasks.Task UTCID05_Invalid_Duration_Throws(int? invalidDuration)
        {
            SetupHttpContext("Assistant");

            var card = new WarrantyCard
            {
                WarrantyCardID = 1,
                StartDate = DateTime.Today,
                Duration = 12
            };

            _warrantyRepoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(card);

            var ex = await Assert.ThrowsAsync<FormatException>(() =>
                _handler.Handle(new EditWarrantyCardCommand
                {
                    WarrantyCardId = 1,
                    Duration = invalidDuration,
                    Status = true
                }, default));

            Assert.Equal(MessageConstants.MSG.MSG98, ex.Message);
        }
    }
}
