using Application.Constants;
using Application.Interfaces;
using HDMS_API.Application.Usecases.UserCommon.ForgotPassword;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.UserCommon
{
    public class ForgotPasswordHandlerTests
    {
        private readonly Mock<IUserCommonRepository> _userRepoMock;
        private readonly IMemoryCache _memoryCache;
        private readonly ForgotPasswordHandler _handler;

        public ForgotPasswordHandlerTests()
        {
            _userRepoMock = new Mock<IUserCommonRepository>();

            var memoryCacheOptions = new MemoryCacheOptions();
            _memoryCache = new MemoryCache(memoryCacheOptions);

            _handler = new ForgotPasswordHandler(_userRepoMock.Object, _memoryCache);
        }

        [Fact(DisplayName = "UTCID01 - Reset successfully with valid token and passwords")]
        public async System.Threading.Tasks.Task UTCID01_ResetPassword_Success()
        {
            // Arrange
            var email = "user@test.com";
            var token = "valid_token";
            _memoryCache.Set($"resetPasswordToken:{token}", email);

            var command = new ForgotPasswordCommand
            {
                ResetPasswordToken = token,
                NewPassword = "Test1@gmail.com",
                ConfirmPassword = "Test1@gmail.com"
            };

            var user = new User { UserID = 1, Email = email };
            _userRepoMock.Setup(r => r.GetUserByEmailAsync(email)).ReturnsAsync(user);
            _userRepoMock.Setup(r => r.ResetPasswordAsync(It.IsAny<User>())).ReturnsAsync(true);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG10, result);
        }

        [Fact(DisplayName = "UTCID02 - Fail when token is expired")]
        public async System.Threading.Tasks.Task UTCID02_ResetPassword_TokenExpired()
        {
            // Arrange
            var command = new ForgotPasswordCommand
            {
                ResetPasswordToken = "expired_token",
                NewPassword = "Test1@gmail.com",
                ConfirmPassword = "Test1@gmail.com"
            };

            // Act + Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG79, ex.Message);
        }

        [Fact(DisplayName = "UTCID03 - Fail when password format is invalid")]
        public async System.Threading.Tasks.Task UTCID03_ResetPassword_InvalidPasswordFormat()
        {
            // Arrange
            var email = "user@test.com";
            var token = "token_format_invalid";
            _memoryCache.Set($"resetPasswordToken:{token}", email);

            var command = new ForgotPasswordCommand
            {
                ResetPasswordToken = token,
                NewPassword = "123",
                ConfirmPassword = "123"
            };

            // Act + Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG02, ex.Message);
        }

        [Fact(DisplayName = "UTCID04 - Fail when password and confirm password do not match")]
        public async System.Threading.Tasks.Task UTCID04_ResetPassword_Mismatch()
        {
            // Arrange
            var email = "user@test.com";
            var token = "token_mismatch";
            _memoryCache.Set($"resetPasswordToken:{token}", email);

            var command = new ForgotPasswordCommand
            {
                ResetPasswordToken = token,
                NewPassword = "Test1@gmail.com",
                ConfirmPassword = "Tes21@gmail.com"
            };

            // Act + Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG43, ex.Message);
        }

        [Fact(DisplayName = "UTCID05 - Fail when user not found by email")]
        public async System.Threading.Tasks.Task UTCID05_ResetPassword_UserNotFound()
        {
            // Arrange
            var email = "user@test.com";
            var token = "token_user_not_found";
            _memoryCache.Set($"resetPasswordToken:{token}", email);

            var command = new ForgotPasswordCommand
            {
                ResetPasswordToken = token,
                NewPassword = "Test1@gmail.com",
                ConfirmPassword = "Test1@gmail.com"
            };

            _userRepoMock.Setup(r => r.GetUserByEmailAsync(email)).ReturnsAsync((User?)null);

            // Act + Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
        }
    }

}