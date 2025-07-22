using Application.Constants;
using Application.Interfaces;
using Application.Services;
using Application.Usecases.UserCommon.ForgotPasswordBySMS;
using HDMS_API.Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.UserCommon
{
    public class ForgotPasswordBySmsHandlerIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly Mock<IEsmsService> _smsServiceMock;
        private readonly ForgotPasswordBySmsHandler _handler;

        public ForgotPasswordBySmsHandlerIntegrationTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            var services = new ServiceCollection();
            services.AddMemoryCache();
            var serviceProvider = services.BuildServiceProvider();
            var memoryCache = serviceProvider.GetService<IMemoryCache>();

            _smsServiceMock = new Mock<IEsmsService>();
            _userCommonRepository = new UserCommonRepository(_context, new Mock<IEmailService>().Object, memoryCache);

            _handler = new ForgotPasswordBySmsHandler(_userCommonRepository, _smsServiceMock.Object);

            SeedData();
        }

        private void SeedData()
        {
            _context.Users.AddRange(
                new User
                {
                    UserID = 1,
                    Fullname = "User One",
                    Username = "user1",
                    Phone = "0900000001",
                    Password = "oldhashed",
                },
                new User
                {
                    UserID = 2,
                    Fullname = "User Two",
                    Username = "user2",
                    Phone = "0900000002",
                    Password = "oldhashed",
                }
            );
            _context.SaveChanges();
        }

        [Fact(DisplayName = "ITCID01 - Should reset password successfully for existing phone")]
        public async System.Threading.Tasks.Task ITCID01_Should_ResetPassword_Successfully()
        {
            // Arrange
            var command = new ForgotPasswordBySmsCommand("0900000001");
            _smsServiceMock.Setup(s => s.SendPasswordAsync("0900000001", It.IsAny<string>())).ReturnsAsync(true);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result);
            var updatedUser = await _context.Users.FirstOrDefaultAsync(u => u.Phone == "0900000001");
            Assert.NotNull(updatedUser);
            Assert.NotEqual("oldhashed", updatedUser.Password);
        }

        [Fact(DisplayName = "ITCID02 - Should throw exception when phone number not found")]
        public async System.Threading.Tasks.Task ITCID02_Should_Throw_WhenPhoneNotFound()
        {
            // Arrange
            var command = new ForgotPasswordBySmsCommand("0999999999");

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
        }
    }
}
