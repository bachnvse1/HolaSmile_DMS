using System.Security.Claims;
using Application.Interfaces;
using Application.Usecases.Dentists.CreatePrescription;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Dentists
{
    public class CreatePrescriptionHandlerTests
    {
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly Mock<IPrescriptionRepository> _prescriptionRepoMock = new();
        private readonly Mock<IAppointmentRepository> _appointmentRepoMock = new();
        private readonly CreatePrescriptionHandler _handler;

        public CreatePrescriptionHandlerTests()
        {
            _handler = new CreatePrescriptionHandler(
                _httpContextAccessorMock.Object,
                _prescriptionRepoMock.Object,
                _appointmentRepoMock.Object
            );
        }

        private void SetupHttpContext(string role, int userId = 1)
        {
            var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Role, role)
        };
            var identity = new ClaimsIdentity(claims);
            var principal = new ClaimsPrincipal(identity);
            _httpContextAccessorMock.Setup(x => x.HttpContext!.User).Returns(principal);
        }

        [Fact(DisplayName = "UTCID01 - User not authenticated should throw")]
        public async System.Threading.Tasks.Task UTCID01_UnauthenticatedUser_Throws()
        {
            _httpContextAccessorMock.Setup(x => x.HttpContext!.User).Returns((ClaimsPrincipal?)null);

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new CreatePrescriptionCommand(), CancellationToken.None));
        }

        [Fact(DisplayName = "UTCID02 - Non-dentist role should throw")]
        public async System.Threading.Tasks.Task UTCID02_NotDentist_Throws()
        {
            SetupHttpContext("receptionist");

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new CreatePrescriptionCommand(), CancellationToken.None));
        }

        [Fact(DisplayName = "UTCID03 - Appointment not found should throw")]
        public async System.Threading.Tasks.Task UTCID03_AppointmentNotFound_Throws()
        {
            SetupHttpContext("dentist");
            _appointmentRepoMock.Setup(r => r.GetAppointmentByIdAsync(It.IsAny<int>())).ReturnsAsync((Appointment?)null);

            await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(new CreatePrescriptionCommand { AppointmentId = 123 }, CancellationToken.None));
        }

        [Fact(DisplayName = "UTCID04 - Existing prescription should throw")]
        public async System.Threading.Tasks.Task UTCID04_ExistingPrescription_Throws()
        {
            SetupHttpContext("dentist");
            _appointmentRepoMock.Setup(r => r.GetAppointmentByIdAsync(It.IsAny<int>())).ReturnsAsync(new Appointment());
            _prescriptionRepoMock.Setup(r => r.GetPrescriptionByAppointmentIdAsync(It.IsAny<int>())).ReturnsAsync(new Prescription());

            await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(new CreatePrescriptionCommand { AppointmentId = 123 }, CancellationToken.None));
        }

        [Fact(DisplayName = "UTCID05 - Empty content should throw")]
        public async System.Threading.Tasks.Task UTCID05_EmptyContent_Throws()
        {
            SetupHttpContext("dentist");
            _appointmentRepoMock.Setup(r => r.GetAppointmentByIdAsync(It.IsAny<int>())).ReturnsAsync(new Appointment());
            _prescriptionRepoMock.Setup(r => r.GetPrescriptionByAppointmentIdAsync(It.IsAny<int>())).ReturnsAsync((Prescription?)null);

            await Assert.ThrowsAsync<ArgumentException>(() =>
                _handler.Handle(new CreatePrescriptionCommand { AppointmentId = 1, contents = "   " }, CancellationToken.None));
        }

        [Fact(DisplayName = "UTCID06 - Create success")]
        public async System.Threading.Tasks.Task UTCID06_CreateSuccess_ReturnsTrue()
        {
            SetupHttpContext("dentist", 10);
            _appointmentRepoMock.Setup(r => r.GetAppointmentByIdAsync(1)).ReturnsAsync(new Appointment());
            _prescriptionRepoMock.Setup(r => r.GetPrescriptionByAppointmentIdAsync(1)).ReturnsAsync((Prescription?)null);
            _prescriptionRepoMock.Setup(r => r.CreatePrescriptionAsync(It.IsAny<Prescription>())).ReturnsAsync(true);

            var result = await _handler.Handle(new CreatePrescriptionCommand { AppointmentId = 1, contents = "Take medicine" }, CancellationToken.None);

            Assert.True(result);
        }

        [Fact(DisplayName = "UTCID07 - Create fails returns false")]
        public async System.Threading.Tasks.Task UTCID07_CreateFails_ReturnsFalse()
        {
            SetupHttpContext("dentist", 10);
            _appointmentRepoMock.Setup(r => r.GetAppointmentByIdAsync(1)).ReturnsAsync(new Appointment());
            _prescriptionRepoMock.Setup(r => r.GetPrescriptionByAppointmentIdAsync(1)).ReturnsAsync((Prescription?)null);
            _prescriptionRepoMock.Setup(r => r.CreatePrescriptionAsync(It.IsAny<Prescription>())).ReturnsAsync(false);

            var result = await _handler.Handle(new CreatePrescriptionCommand { AppointmentId = 1, contents = "Take medicine" }, CancellationToken.None);

            Assert.False(result);
        }
    }

}
