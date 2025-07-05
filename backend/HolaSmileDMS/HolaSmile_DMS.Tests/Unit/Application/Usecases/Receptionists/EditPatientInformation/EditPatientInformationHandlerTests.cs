using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Receptionist.EditPatientInformation;
using Application.Usecases.SendNotification;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Receptionists.EditPatientInformation
{
    public class EditPatientInformationHandlerTests
    {
        private readonly Mock<IUserCommonRepository> _userRepoMock = new();
        private readonly Mock<IPatientRepository> _patientRepoMock = new();
        private readonly Mock<IMapper> _mapperMock = new();
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly Mock<IMediator> _mediatorMock = new();

        private readonly EditPatientInformationHandler _handler;

        public EditPatientInformationHandlerTests()
        {
            _handler = new EditPatientInformationHandler(
                _userRepoMock.Object,
                _patientRepoMock.Object,
                _mapperMock.Object,
                _httpContextAccessorMock.Object,
                _mediatorMock.Object
            );
        }

        private void SetupHttpContext(string role, int userId)
        {
            var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Role, role)
        };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = principal };

            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);
        }

        [Fact(DisplayName = "UTCID01 - Abnormal - Unauthorized role throws exception")]
        public async System.Threading.Tasks.Task UTCID01_UnauthorizedRole_Throws()
        {
            // Arrange
            SetupHttpContext("assistant", 1);
            var command = new EditPatientInformationCommand();

            // Act + Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID02 - Abnormal - Patient not found")]
        public async System.Threading.Tasks.Task UTCID02_PatientNotFound_Throws()
        {
            // Arrange
            SetupHttpContext("receptionist", 1);
            var command = new EditPatientInformationCommand { PatientID = 1 };
            _patientRepoMock.Setup(r => r.GetPatientByPatientIdAsync(1)).ReturnsAsync((Patient)null!);

            // Act + Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG27, ex.Message);
        }

        [Fact(DisplayName = "UTCID03 - Abnormal - Empty FullName")]
        public async System.Threading.Tasks.Task UTCID03_EmptyFullName_Throws()
        {
            // Arrange
            SetupHttpContext("receptionist", 1);
            var command = new EditPatientInformationCommand
            {
                PatientID = 1,
                FullName = ""
            };
            _patientRepoMock.Setup(r => r.GetPatientByPatientIdAsync(1)).ReturnsAsync(new Patient { User = new User() });

            // Act + Assert
            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
        }

        [Fact(DisplayName = "UTCID04 - Abnormal - Invalid email format")]
        public async System.Threading.Tasks.Task UTCID04_InvalidEmail_Throws()
        {
            // Arrange
            SetupHttpContext("receptionist", 1);
            var command = new EditPatientInformationCommand
            {
                PatientID = 1,
                FullName = "Test",
                Email = "invalid_email"
            };
            _patientRepoMock.Setup(r => r.GetPatientByPatientIdAsync(1)).ReturnsAsync(new Patient { User = new User() });

            // Act + Assert
            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG08, ex.Message);
        }

        [Fact(DisplayName = "UTCID05 - Abnormal - Email already exists")]
        public async System.Threading.Tasks.Task UTCID05_EmailExists_Throws()
        {
            // Arrange
            SetupHttpContext("receptionist", 1);
            var command = new EditPatientInformationCommand
            {
                PatientID = 1,
                FullName = "Test",
                Email = "test@example.com"
            };
            _patientRepoMock.Setup(r => r.GetPatientByPatientIdAsync(1)).ReturnsAsync(new Patient { User = new User() });
            _patientRepoMock.Setup(r => r.CheckEmailPatientAsync("test@example.com"))
                .ReturnsAsync(new Patient { PatientID = 999 });

            // Act + Assert
            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG22, ex.Message);
        }

        [Fact(DisplayName = "UTCID06 - Abnormal - Missing address")]
        public async System.Threading.Tasks.Task UTCID06_EmptyAddress_Throws()
        {
            // Arrange
            SetupHttpContext("receptionist", 1);
            var command = new EditPatientInformationCommand
            {
                PatientID = 1,
                FullName = "Test",
                Email = "test@example.com",
                Address = ""
            };
            _patientRepoMock.Setup(r => r.GetPatientByPatientIdAsync(1)).ReturnsAsync(new Patient { User = new User() });
            _patientRepoMock.Setup(r => r.CheckEmailPatientAsync("test@example.com")).ReturnsAsync((Patient)null!);

            // Act + Assert
            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
        }

        [Fact(DisplayName = "UTCID07 - Abnormal - Update failed")]
        public async System.Threading.Tasks.Task UTCID07_UpdateFails_Throws()
        {
            // Arrange
            SetupHttpContext("receptionist", 1);
            var command = new EditPatientInformationCommand
            {
                PatientID = 1,
                FullName = "Test",
                Email = "test@example.com",
                Address = "123 Street",
                Dob = "01/01/2000",
                Gender = true
            };
            _patientRepoMock.Setup(r => r.GetPatientByPatientIdAsync(1)).ReturnsAsync(new Patient { User = new User() });
            _patientRepoMock.Setup(r => r.CheckEmailPatientAsync("test@example.com")).ReturnsAsync((Patient)null!);
            _patientRepoMock.Setup(r => r.UpdatePatientInforAsync(It.IsAny<Patient>())).ReturnsAsync(false);

            // Act + Assert
            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG31, ex.Message);
        }

        [Fact(DisplayName = "UTCID08 - Normal - Edit successful")]
        public async System.Threading.Tasks.Task UTCID08_EditPatient_Success()
        {
            // Arrange
            SetupHttpContext("receptionist", 1);
            var command = new EditPatientInformationCommand
            {
                PatientID = 1,
                FullName = "Updated Name",
                Email = "updated@example.com",
                Address = "New Address",
                Dob = "01/01/2000",
                Gender = true
            };
            var patient = new Patient { PatientID = 1, User = new User { UserID = 10 } };
            _patientRepoMock.Setup(r => r.GetPatientByPatientIdAsync(1)).ReturnsAsync(patient);
            _patientRepoMock.Setup(r => r.CheckEmailPatientAsync(command.Email)).ReturnsAsync((Patient)null!);
            _patientRepoMock.Setup(r => r.UpdatePatientInforAsync(It.IsAny<Patient>())).ReturnsAsync(true);
            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Updated Name", result.User.Fullname);
            Assert.Equal("updated@example.com", result.User.Email);
            Assert.Equal("New Address", result.User.Address);
        }
    }
}
