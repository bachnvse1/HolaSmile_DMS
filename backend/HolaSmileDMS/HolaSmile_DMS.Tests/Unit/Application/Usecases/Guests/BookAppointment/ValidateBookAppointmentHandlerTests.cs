using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Guests.BookAppointment;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Guests
{
    public class ValidateBookAppointmentHandlerTests
    {
        private readonly Mock<IUserCommonRepository> _userRepoMock;
        private readonly ValidateBookAppointmentHandler _handler;

        public ValidateBookAppointmentHandlerTests()
        {
            _userRepoMock = new Mock<IUserCommonRepository>();

            _handler = new ValidateBookAppointmentHandler(_userRepoMock.Object);
        }

        [Fact(DisplayName = "UTCID01 - FullName is empty → throw MSG07")]
        public async System.Threading.Tasks.Task UTCID01_EmptyFullName_ThrowsException()
        {
            var command = new ValidateBookAppointmentCommand { FullName = " " };
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
        }

        [Fact(DisplayName = "UTCID02 - Email is invalid → throw MSG08")]
        public async System.Threading.Tasks.Task UTCID02_InvalidEmail_ThrowsException()
        {
            var command = new ValidateBookAppointmentCommand { FullName = "A", Email = "invalid" };
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG08, ex.Message);
        }

        [Fact(DisplayName = "UTCID03 - Phone number is invalid → throw MSG65")]
        public async System.Threading.Tasks.Task UTCID03_InvalidPhoneNumber_ThrowsException()
        {
            var command = new ValidateBookAppointmentCommand
            {
                FullName = "A",
                Email = "valid@email.com",
                PhoneNumber = "abc123"
            };
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG56, ex.Message);
        }

        [Fact(DisplayName = "UTCID04 - Phone number already exists → throw MSG90")]
        public async System.Threading.Tasks.Task UTCID04_PhoneNumberExists_ThrowsException()
        {
            _userRepoMock.Setup(r => r.GetUserByPhoneAsync("0123456789"))
                .ReturnsAsync(new User { Phone = "0123456789" });

            var command = new ValidateBookAppointmentCommand
            {
                FullName = "A",
                Email = "valid@email.com",
                PhoneNumber = "0123456789"
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG90, ex.Message);
        }

        [Fact(DisplayName = "UTCID05 - Email already exists → throw MSG22")]
        public async System.Threading.Tasks.Task UTCID05_EmailExists_ThrowsException()
        {
            _userRepoMock.Setup(r => r.GetUserByPhoneAsync(It.IsAny<string>()))
                .ReturnsAsync((User)null);
            _userRepoMock.Setup(r => r.GetUserByEmailAsync("test@email.com"))
                .ReturnsAsync(new User { Email = "test@email.com" });

            var command = new ValidateBookAppointmentCommand
            {
                FullName = "A",
                Email = "test@email.com",
                PhoneNumber = "0987654321"
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG22, ex.Message);
        }

        [Fact(DisplayName = "UTCID06 - Valid input → return request")]
        public async System.Threading.Tasks.Task UTCID06_ValidInput_ReturnsRequest()
        {
            _userRepoMock.Setup(r => r.GetUserByPhoneAsync(It.IsAny<string>()))
                .ReturnsAsync((User)null);
            _userRepoMock.Setup(r => r.GetUserByEmailAsync(It.IsAny<string>()))
                .ReturnsAsync((User)null);

            var command = new ValidateBookAppointmentCommand
            {
                FullName = "Valid Name",
                Email = "valid@email.com",
                PhoneNumber = "0912345678"
            };

            var result = await _handler.Handle(command, default);

            Assert.NotNull(result);
            Assert.Equal(command, result);
        }
    }
}
