using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistants.DeactivePatientDentalImage;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants
{
    public class DeactivePatientDentalImageHandlerTests
    {
        private readonly Mock<IImageRepository> _imageRepoMock = new();
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly DeactivePatientDentalImageHandler _handler;

        public DeactivePatientDentalImageHandlerTests()
        {
            _handler = new DeactivePatientDentalImageHandler(
                _imageRepoMock.Object,
                _httpContextAccessorMock.Object
            );
        }

        private void SetupHttpContext(string? role, string userId = "1")
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

        [Fact(DisplayName = "UTCID01 - Assistant xoá ảnh thành công")]
        public async System.Threading.Tasks.Task UTCID01_Assistant_Delete_Success()
        {
            // Arrange
            SetupHttpContext("Assistant");
            var image = new Image { ImageId = 1, IsDeleted = false };
            var command = new DeactivePatientDentalImageCommand { ImageId = 1 };

            _imageRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(image);
            _imageRepoMock.Setup(r => r.UpdateAsync(It.IsAny<Image>())).ReturnsAsync(true);

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.Equal("Xoá ảnh thành công.", result);
        }

        [Fact(DisplayName = "UTCID02 - Không có quyền => UnauthorizedAccessException")]
        public async System.Threading.Tasks.Task UTCID02_InvalidRole_ThrowsUnauthorized()
        {
            // Arrange
            SetupHttpContext("Receptionist");
            var command = new DeactivePatientDentalImageCommand { ImageId = 1 };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID03 - Ảnh không tồn tại => KeyNotFoundException")]
        public async System.Threading.Tasks.Task UTCID03_Image_Not_Found_Should_Throw()
        {
            // Arrange
            SetupHttpContext("Assistant");
            var command = new DeactivePatientDentalImageCommand { ImageId = 99 };

            _imageRepoMock.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((Image?)null);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Equal("Không tìm thấy ảnh hoặc ảnh đã bị xoá.", ex.Message);
        }

        [Fact(DisplayName = "UTCID04 - Ảnh đã bị xoá => KeyNotFoundException")]
        public async System.Threading.Tasks.Task UTCID04_Image_Already_Deleted_Should_Throw()
        {
            // Arrange
            SetupHttpContext("Dentist");
            var command = new DeactivePatientDentalImageCommand { ImageId = 2 };
            var image = new Image { ImageId = 2, IsDeleted = true };

            _imageRepoMock.Setup(r => r.GetByIdAsync(2)).ReturnsAsync(image);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Equal("Không tìm thấy ảnh hoặc ảnh đã bị xoá.", ex.Message);
        }

        [Fact(DisplayName = "UTCID05 - Update thất bại => Exception")]
        public async System.Threading.Tasks.Task UTCID05_Update_Failed_Should_Throw()
        {
            // Arrange
            SetupHttpContext("Assistant");
            var command = new DeactivePatientDentalImageCommand { ImageId = 3 };
            var image = new Image { ImageId = 3, IsDeleted = false };

            _imageRepoMock.Setup(r => r.GetByIdAsync(3)).ReturnsAsync(image);
            _imageRepoMock.Setup(r => r.UpdateAsync(It.IsAny<Image>())).ReturnsAsync(false);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(command, default));

            Assert.Equal("Không thể xoá ảnh khỏi hệ thống.", ex.Message);
        }
    }
}
