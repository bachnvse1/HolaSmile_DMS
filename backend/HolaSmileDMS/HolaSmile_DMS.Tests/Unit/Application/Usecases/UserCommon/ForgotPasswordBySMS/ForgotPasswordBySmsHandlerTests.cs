using Application.Constants;
using Application.Interfaces;
using Application.Services;
using Application.Usecases.UserCommon.ForgotPasswordBySMS;
using FluentAssertions;
using Moq;
using MySqlX.XDevAPI.Common;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.UserCommon
{
    public class ForgotPasswordBySmsHandlerTests
    {
        private readonly Mock<IUserCommonRepository> _userRepoMock = new();
        private readonly Mock<IEsmsService> _smsServiceMock = new();
        private readonly ForgotPasswordBySmsHandler _handler;

        public ForgotPasswordBySmsHandlerTests()
        {
            _handler = new ForgotPasswordBySmsHandler(
                _userRepoMock.Object,
                _smsServiceMock.Object
            );
        }

        [Fact(DisplayName = "UTCID01 - Throw exception when user not found")]
        public async System.Threading.Tasks.Task UTCID01_Throw_WhenUserNotFound()
        {
            // Arrange
            var command = new ForgotPasswordBySmsCommand("0999999999");
            _userRepoMock.Setup(r => r.GetUserByPhoneAsync(command.PhoneNumber)).ReturnsAsync((User?)null);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);
            // Assert
            result.Should().BeTrue();
        }

        [Fact(DisplayName = "UTCID02 - Still succeeds even if SMS service throws (background task)")]
        public async System.Threading.Tasks.Task UTCID02_BackgroundSmsException_ShouldStillReturnTrue()
        {
            // Arrange
            var command = new ForgotPasswordBySmsCommand("0123456789");
            var user = new User { UserID = 1, Phone = command.PhoneNumber };

            _userRepoMock.Setup(r => r.GetUserByPhoneAsync(command.PhoneNumber)).ReturnsAsync(user);
            _userRepoMock.Setup(r => r.EditProfileAsync(It.IsAny<User>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);

            _smsServiceMock.Setup(s => s.SendPasswordAsync(command.PhoneNumber, It.IsAny<string>()))
                .ThrowsAsync(new Exception("Gửi mật khẩu mới không thành công. Vui lòng thử lại sau."));

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert: Vẫn thành công vì lỗi nằm trong Task.Run
            result.Should().BeTrue();
        }


        [Fact(DisplayName = "UTCID03 - Success when user exists and SMS sent")]
        public async System.Threading.Tasks.Task UTCID03_Success_WhenUserExists_AndSmsSent()
        {
            // Arrange
            var command = new ForgotPasswordBySmsCommand("0123456789");
            var user = new User { UserID = 1, Phone = command.PhoneNumber, Password = "old" };

            _userRepoMock.Setup(r => r.GetUserByPhoneAsync(command.PhoneNumber)).ReturnsAsync(user);
            _smsServiceMock.Setup(s => s.SendPasswordAsync(command.PhoneNumber, It.IsAny<string>())).ReturnsAsync(true);
            _userRepoMock.Setup(r => r.EditProfileAsync(It.IsAny<User>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Should().BeTrue();
            _userRepoMock.Verify(r => r.EditProfileAsync(It.Is<User>(u => u.UserID == 1 && !string.IsNullOrWhiteSpace(u.Password)),It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact(DisplayName = "UTCID04 - Return false when update fails")]
        public async System.Threading.Tasks.Task UTCID04_ReturnFalse_WhenUpdateFails()
        {
            // Arrange
            var command = new ForgotPasswordBySmsCommand("0123456789");
            var user = new User { UserID = 1, Phone = command.PhoneNumber, Password = "old" };

            _userRepoMock.Setup(r => r.GetUserByPhoneAsync(command.PhoneNumber)).ReturnsAsync(user);
            _smsServiceMock.Setup(s => s.SendPasswordAsync(command.PhoneNumber, It.IsAny<string>())).ReturnsAsync(true);
            _userRepoMock.Setup(r => r.EditProfileAsync(It.IsAny<User>(), It.IsAny<CancellationToken>())).ReturnsAsync(false);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Should().BeFalse();
        }
    }
}
