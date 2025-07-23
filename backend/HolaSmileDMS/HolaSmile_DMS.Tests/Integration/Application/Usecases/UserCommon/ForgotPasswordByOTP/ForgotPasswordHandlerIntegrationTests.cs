using Application.Constants;
using Application.Interfaces;
using HDMS_API.Application.Interfaces;
using HDMS_API.Application.Usecases.UserCommon.ForgotPassword;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.UserCommon
{
    public class ForgotPasswordHandlerIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IMemoryCache _memoryCache;
        private readonly ForgotPasswordHandler _handler;

        public ForgotPasswordHandlerIntegrationTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
               .UseInMemoryDatabase(Guid.NewGuid().ToString())
               .Options;

            _context = new ApplicationDbContext(options);

            var services = new ServiceCollection();
            services.AddMemoryCache();
            var serviceProvider = services.BuildServiceProvider();

            _memoryCache = serviceProvider.GetRequiredService<IMemoryCache>();

            var emailServiceMock = new Mock<IEmailService>();
            _userCommonRepository = new UserCommonRepository(_context, emailServiceMock.Object);
            _handler = new ForgotPasswordHandler(_userCommonRepository, _memoryCache);

            SeedData();
        }

        private void SeedData()
        {
            _context.Users.Add(new User
            {
                UserID = 1,
                Email = "user@example.com",
                Password = BCrypt.Net.BCrypt.HashPassword("OldPassword123!"),
                Fullname = "User One",
                Username = "Test",
                Phone = "0123456789",
                CreatedAt = DateTime.Now
            });

            _context.SaveChanges();
        }

        [Fact(DisplayName = "ITCID01 - Reset password successfully with valid token")]
        public async System.Threading.Tasks.Task ITCID01_ResetPasswordSuccess()
        {
            // Arrange
            string token = "valid-token";
            _memoryCache.Set($"resetPasswordToken:{token}", "user@example.com");

            var command = new ForgotPasswordCommand
            {
                ResetPasswordToken = token,
                NewPassword = "NewPass123!",
                ConfirmPassword = "NewPass123!"
            };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG10, result);
        }

        [Fact(DisplayName = "ITCID02 - Throw error if token expired")]
        public async System.Threading.Tasks.Task ITCID02_TokenExpired()
        {
            // Arrange
            var command = new ForgotPasswordCommand
            {
                ResetPasswordToken = "invalid-token",
                NewPassword = "NewPass123!",
                ConfirmPassword = "NewPass123!"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG79, ex.Message);
        }

        [Fact(DisplayName = "ITCID03 - Throw error if password format invalid")]
        public async System.Threading.Tasks.Task ITCID03_InvalidPasswordFormat()
        {
            // Arrange
            string token = "format-token";
            _memoryCache.Set($"resetPasswordToken:{token}", "user@example.com");

            var command = new ForgotPasswordCommand
            {
                ResetPasswordToken = token,
                NewPassword = "123",
                ConfirmPassword = "123"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG02, ex.Message);
        }

        [Fact(DisplayName = "ITCID04 - Throw error if password confirmation mismatch")]
        public async System.Threading.Tasks.Task ITCID04_PasswordMismatch()
        {
            // Arrange
            string token = "mismatch-token";
            _memoryCache.Set($"resetPasswordToken:{token}", "user@example.com");

            var command = new ForgotPasswordCommand
            {
                ResetPasswordToken = token,
                NewPassword = "ValidPass123!",
                ConfirmPassword = "MismatchPass123!"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG43, ex.Message);
        }

        [Fact(DisplayName = "ITCID05 - Throw error if user email not found")]
        public async System.Threading.Tasks.Task ITCID05_UserNotFound()
        {
            // Arrange
            string token = "notfound-token";
            _memoryCache.Set($"resetPasswordToken:{token}", "notfound@example.com");

            var command = new ForgotPasswordCommand
            {
                ResetPasswordToken = token,
                NewPassword = "ValidPass123!",
                ConfirmPassword = "ValidPass123!"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
        }
    }
}
