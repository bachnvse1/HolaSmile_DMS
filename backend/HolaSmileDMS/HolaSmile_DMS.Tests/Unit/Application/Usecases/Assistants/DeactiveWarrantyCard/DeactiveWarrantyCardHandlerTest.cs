using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.DeactiveWarrantyCard;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants
{
    public class DeactiveWarrantyCardHandlerTests
    {
        private readonly Mock<IWarrantyCardRepository> _warrantyRepoMock = new();
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly DeactiveWarrantyCardHandler _handler;

        public DeactiveWarrantyCardHandlerTests()
        {
            _handler = new DeactiveWarrantyCardHandler(
                _warrantyRepoMock.Object,
                _httpContextAccessorMock.Object
            );
        }

        private void SetupHttpContext(string? role, string? userId = "99")
        {
            if (role == null)
            {
                _httpContextAccessorMock.Setup(h => h.HttpContext).Returns((HttpContext?)null);
                return;
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, userId)
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = principal };

            _httpContextAccessorMock.Setup(h => h.HttpContext).Returns(context);
        }

        [Fact(DisplayName = "Normal - UTCID01 - Assistant deactivates warranty card successfully")]
        public async System.Threading.Tasks.Task UTCID01_Assistant_Deactivates_WarrantyCard_Successfully()
        {
            // Arrange
            SetupHttpContext("Assistant", "99");

            var card = new WarrantyCard
            {
                WarrantyCardID = 1,
                Status = true
            };

            _warrantyRepoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(card);

            _warrantyRepoMock.Setup(r => r.DeactiveWarrantyCardAsync(card, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            // Act
            var result = await _handler.Handle(new DeactiveWarrantyCardCommand { WarrantyCardId = 1 }, default);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG105, result);
            Assert.False(card.Status);
            Assert.Equal(99, card.UpdatedBy);
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - HttpContext is null throws MSG17")]
        public async System.Threading.Tasks.Task UTCID02_HttpContext_Is_Null_Throws()
        {
            // Arrange
            SetupHttpContext(null);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new DeactiveWarrantyCardCommand { WarrantyCardId = 1 }, default));

            Assert.Equal(MessageConstants.MSG.MSG17, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Not Assistant role throws MSG26")]
        public async System.Threading.Tasks.Task UTCID03_Not_Assistant_Role_Throws()
        {
            // Arrange
            SetupHttpContext("Patient");

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new DeactiveWarrantyCardCommand { WarrantyCardId = 1 }, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID04 - Warranty card not found throws MSG102")]
        public async System.Threading.Tasks.Task UTCID04_Card_Not_Found_Throws()
        {
            // Arrange
            SetupHttpContext("Assistant");

            _warrantyRepoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync((WarrantyCard?)null);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(new DeactiveWarrantyCardCommand { WarrantyCardId = 1 }, default));

            Assert.Equal(MessageConstants.MSG.MSG103, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID05 - Card already deactivated throws MSG103")]
        public async System.Threading.Tasks.Task UTCID05_Already_Deactivated_Throws()
        {
            // Arrange
            SetupHttpContext("Assistant");

            var card = new WarrantyCard
            {
                WarrantyCardID = 1,
                Status = false
            };

            _warrantyRepoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(card);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _handler.Handle(new DeactiveWarrantyCardCommand { WarrantyCardId = 1 }, default));

            Assert.Equal(MessageConstants.MSG.MSG104, ex.Message);
        }
    }
}
