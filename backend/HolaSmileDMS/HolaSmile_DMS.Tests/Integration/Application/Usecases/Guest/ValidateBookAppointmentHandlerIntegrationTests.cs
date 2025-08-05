using Application.Constants;
using Application.Usecases.Guests.BookAppointment;
using Moq;
using Xunit;
using Application.Interfaces;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Guests
{
    public class ValidateBookAppointmentHandlerIntegrationTests
    {
        private readonly ValidateBookAppointmentHandler _handler;
        private readonly Mock<IUserCommonRepository> _userCommonRepositoryMock;

        public ValidateBookAppointmentHandlerIntegrationTests()
        {
            _userCommonRepositoryMock = new Mock<IUserCommonRepository>();

            _handler = new ValidateBookAppointmentHandler(_userCommonRepositoryMock.Object);
        }

        [Fact]
        public async System.Threading.Tasks.Task ValidateBookAppointment_FullNameEmpty_ThrowsMSG07()
        {
            // Arrange
            var command = new ValidateBookAppointmentCommand
            {
                FullName = " ",
                Email = "test@example.com",
                PhoneNumber = "0912345678"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
        }

        [Fact]
        public async System.Threading.Tasks.Task ValidateBookAppointment_InvalidEmail_ThrowsMSG08()
        {
            // Arrange
            var command = new ValidateBookAppointmentCommand
            {
                FullName = "Nguyen Van A",
                Email = "invalid_email",
                PhoneNumber = "0912345678"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG08, ex.Message);
        }

        [Fact]
        public async System.Threading.Tasks.Task ValidateBookAppointment_InvalidPhone_ThrowsMSG56()
        {
            // Arrange
            var command = new ValidateBookAppointmentCommand
            {
                FullName = "Nguyen Van A",
                Email = "test@example.com",
                PhoneNumber = "invalid_phone"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG56, ex.Message);
        }

        [Fact]
        public async System.Threading.Tasks.Task ValidateBookAppointment_PhoneExists_ThrowsMSG90()
        {
            // Arrange
            var command = new ValidateBookAppointmentCommand
            {
                FullName = "Nguyen Van A",
                Email = "test@example.com",
                PhoneNumber = "0912345678"
            };

            _userCommonRepositoryMock.Setup(x => x.GetUserByPhoneAsync(command.PhoneNumber))
                .ReturnsAsync(new User { UserID = 1 });

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG90, ex.Message);
        }

        [Fact]
        public async System.Threading.Tasks.Task ValidateBookAppointment_EmailExists_ThrowsMSG22()
        {
            // Arrange
            var command = new ValidateBookAppointmentCommand
            {
                FullName = "Nguyen Van A",
                Email = "test@example.com",
                PhoneNumber = "0912345678"
            };

            _userCommonRepositoryMock.Setup(x => x.GetUserByEmailAsync(command.Email))
                .ReturnsAsync(new User { UserID = 2 });

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG22, ex.Message);
        }

        [Fact]
        public async System.Threading.Tasks.Task ValidateBookAppointment_ValidInput_ReturnsRequest()
        {
            // Arrange
            var command = new ValidateBookAppointmentCommand
            {
                FullName = "Nguyen Van A",
                Email = "test@example.com",
                PhoneNumber = "0912345678"
            };

            _userCommonRepositoryMock.Setup(x => x.GetUserByPhoneAsync(command.PhoneNumber))
                .ReturnsAsync((User)null);

            _userCommonRepositoryMock.Setup(x => x.GetUserByEmailAsync(command.Email))
                .ReturnsAsync((User)null);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(command.FullName, result.FullName);
            Assert.Equal(command.Email, result.Email);
            Assert.Equal(command.PhoneNumber, result.PhoneNumber);
        }
    }
}
