using Application.Constants;
using Application.Interfaces;
using HDMS_API.Application.Usecases.UserCommon.Login;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.UserCommon
{
    public class LoginHandlerTests
    {
        private readonly Mock<IUserCommonRepository> _userRepoMock = new();
        private readonly Mock<IPasswordHasher> _passwordHasherMock = new();
        private readonly Mock<IJwtService> _jwtServiceMock = new();

        private readonly LoginHandler _handler;

        public LoginHandlerTests()
        {
            _handler = new LoginHandler(_userRepoMock.Object, _passwordHasherMock.Object, _jwtServiceMock.Object);
        }

        [Fact(DisplayName = "Adnormal - UTCID01 - User not found should throw MSG01")]
        public async System.Threading.Tasks.Task Handle_ShouldThrow_WhenUserNotFound()
        {
            var command = new LoginCommand { Username = "nonexistent", Password = "pwd" };
            _userRepoMock.Setup(r => r.GetByUsernameAsync(command.Username, default)).ReturnsAsync((User?)null);
            var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG01, exception.Message);
        }

        [Fact(DisplayName = "Adnormal - UTCID02 - User is disabled should throw MSG72")]
        public async System.Threading.Tasks.Task Handle_ShouldThrow_WhenUserIsDisabled()
        {
            var command = new LoginCommand { Username = "disabled", Password = "pwd" };
            var user = new User { Username = command.Username, Status = false };
            _userRepoMock.Setup(r => r.GetByUsernameAsync(command.Username, default)).ReturnsAsync(user);
            var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG72, exception.Message);
        }

        [Fact(DisplayName = "Adnormal - UTCID03 - Invalid password should throw MSG01")]
        public async System.Threading.Tasks.Task Handle_ShouldThrow_WhenPasswordInvalid()
        {
            var command = new LoginCommand { Username = "user", Password = "wrong" };
            var user = new User { Username = command.Username, Status = true, Password = "hashedpwd" };
            _userRepoMock.Setup(r => r.GetByUsernameAsync(command.Username, default)).ReturnsAsync(user);
            _passwordHasherMock.Setup(h => h.Verify(command.Password, user.Password)).Returns(false);
            var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG01, exception.Message);
        }

        [Fact(DisplayName = "Normal - UTCID04 - Successful login should return token")]
        public async System.Threading.Tasks.Task Handle_ShouldReturnToken_WhenLoginSuccess()
        {
            var command = new LoginCommand { Username = "user", Password = "pwd" };
            var user = new User { UserID = 1, Username = command.Username, Status = true, Password = "hashedpwd" };
            _userRepoMock.Setup(r => r.GetByUsernameAsync(command.Username, default)).ReturnsAsync(user);
            _passwordHasherMock.Setup(h => h.Verify(command.Password, user.Password)).Returns(true);
            _userRepoMock.Setup(r => r.GetUserRoleAsync(user.Username, default)).ReturnsAsync("Patient");
            _jwtServiceMock.Setup(j => j.GenerateJWTToken(user, "Patient")).Returns("mock-jwt");
            _jwtServiceMock.Setup(j => j.GenerateRefreshToken(user.UserID.ToString())).Returns("mock-refresh");
            var result = await _handler.Handle(command, default);
            Assert.True(result.Success);
            Assert.Equal("mock-jwt", result.Token);
            Assert.Equal("mock-refresh", result.refreshToken);
            Assert.Equal("Patient", result.Role);
        }

        [Fact(DisplayName = "Boundary - UTCID05 - Empty username should throw MSG01")]
        public async System.Threading.Tasks.Task Handle_ShouldThrow_WhenUsernameIsEmpty()
        {
            var command = new LoginCommand { Username = "", Password = "123456" };
            _userRepoMock.Setup(r => r.GetByUsernameAsync(command.Username, default)).ReturnsAsync((User?)null);
            var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG01, exception.Message);
        }

        [Fact(DisplayName = "Boundary - UTCID06 - Empty password should throw MSG01")]
        public async System.Threading.Tasks.Task Handle_ShouldThrow_WhenPasswordIsEmpty()
        {
            var command = new LoginCommand { Username = "user", Password = "" };
            var user = new User { Username = command.Username, Status = true, Password = "hashedpwd" };
            _userRepoMock.Setup(r => r.GetByUsernameAsync(command.Username, default)).ReturnsAsync(user);
            _passwordHasherMock.Setup(h => h.Verify(command.Password, user.Password)).Returns(false);
            var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG01, exception.Message);
        }

        [Fact(DisplayName = "Boundary - UTCID07 - Username exceeds max length should throw")]
        public async System.Threading.Tasks.Task Handle_ShouldThrow_WhenUsernameTooLong()
        {
            var longUsername = new string('a', 300);
            var command = new LoginCommand { Username = longUsername, Password = "123" };
            _userRepoMock.Setup(r => r.GetByUsernameAsync(command.Username, default)).ReturnsAsync((User?)null);
            var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG01, exception.Message);
        }

        [Fact(DisplayName = "Normal - UTCID08 - Role is receptionist should login successfully")]
        public async System.Threading.Tasks.Task Handle_ShouldReturnReceptionistToken_WhenLoginSuccess()
        {
            var command = new LoginCommand { Username = "receptionist", Password = "pwd" };
            var user = new User { UserID = 2, Username = command.Username, Status = true, Password = "hashedpwd" };
            _userRepoMock.Setup(r => r.GetByUsernameAsync(command.Username, default)).ReturnsAsync(user);
            _passwordHasherMock.Setup(h => h.Verify(command.Password, user.Password)).Returns(true);
            _userRepoMock.Setup(r => r.GetUserRoleAsync(user.Username, default)).ReturnsAsync("Receptionist");
            _jwtServiceMock.Setup(j => j.GenerateJWTToken(user, "Receptionist")).Returns("token-recep");
            _jwtServiceMock.Setup(j => j.GenerateRefreshToken(user.UserID.ToString())).Returns("refresh-recep");
            var result = await _handler.Handle(command, default);
            Assert.True(result.Success);
            Assert.Equal("token-recep", result.Token);
            Assert.Equal("refresh-recep", result.refreshToken);
            Assert.Equal("Receptionist", result.Role);
        }

        [Fact(DisplayName = "Adnormal - UTCID09 - Role lookup fails should throw")]
        public async System.Threading.Tasks.Task Handle_ShouldThrow_WhenRoleLookupFails()
        {
            var command = new LoginCommand { Username = "user", Password = "pwd" };
            var user = new User { UserID = 1, Username = command.Username, Status = true, Password = "hashedpwd" };
            _userRepoMock.Setup(r => r.GetByUsernameAsync(command.Username, default)).ReturnsAsync(user);
            _passwordHasherMock.Setup(h => h.Verify(command.Password, user.Password)).Returns(true);
            _userRepoMock.Setup(r => r.GetUserRoleAsync(user.Username, default)).ThrowsAsync(new Exception("Role fetch failed"));
            await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        }
    }
}
