using Application.Constants;
using Application.Interfaces;
using Application.Usecases.UserCommon.ViewPatientPrescription;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.UserCommon
{
    public class ViewPatientPrescriptionHandlerTests
    {
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly Mock<IPrescriptionRepository> _prescriptionRepoMock;
        private readonly Mock<IPatientRepository> _patientRepoMock;
        private readonly Mock<IDentistRepository> _dentistRepoMock;
        private readonly ViewPatientPrescriptionHandler _handler;

        public ViewPatientPrescriptionHandlerTests()
        {
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _prescriptionRepoMock = new Mock<IPrescriptionRepository>();
            _patientRepoMock = new Mock<IPatientRepository>();
            _dentistRepoMock = new Mock<IDentistRepository>();

            _handler = new ViewPatientPrescriptionHandler(
                _httpContextAccessorMock.Object,
                _patientRepoMock.Object,
                _prescriptionRepoMock.Object,
                _dentistRepoMock.Object
            );
        }

        private void SetupHttpContext(string role, int userId)
        {
            var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        };
            var identity = new ClaimsIdentity(claims);
            var user = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = user };
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);
        }

        [Fact(DisplayName = "UTCID01 - Throws Exception if prescription not found")]
        public async System.Threading.Tasks.Task UTCID01_ShouldThrow_WhenPrescriptionNotFound()
        {
            SetupHttpContext("dentist", 2);
            _prescriptionRepoMock.Setup(x => x.GetPrescriptionByPrescriptionIdAsync(1))
                .ReturnsAsync((Prescription)null);

            var command = new ViewPatientPrescriptionCommand(1);

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
        }

        [Fact(DisplayName = "UTCID02 - Throws UnauthorizedAccessException if patient accesses others' prescription")]
        public async System.Threading.Tasks.Task UTCID02_ShouldThrow_IfPatientAccessesOthers()
        {
            SetupHttpContext("patient", 10);

            var prescription = new Prescription
            {
                PrescriptionId = 1,
                AppointmentId = 5,
                Content = "Test",
                Appointment = new Appointment { PatientId = 99 },
                CreateBy = 8
            };

            _prescriptionRepoMock.Setup(x => x.GetPrescriptionByPrescriptionIdAsync(1))
                .ReturnsAsync(prescription);
            _patientRepoMock.Setup(x => x.GetPatientByUserIdAsync(10))
                .ReturnsAsync(new Patient { PatientID = 10 });

            var command = new ViewPatientPrescriptionCommand(1);

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID03 - Throws Exception if dentist not found")]
        public async System.Threading.Tasks.Task UTCID03_ShouldThrow_WhenDentistNotFound()
        {
            SetupHttpContext("dentist", 3);

            var prescription = new Prescription
            {
                PrescriptionId = 1,
                AppointmentId = 5,
                Content = "Test Content",
                Appointment = new Appointment { PatientId = 12 },
                CreateBy = 99
            };

            _prescriptionRepoMock.Setup(x => x.GetPrescriptionByPrescriptionIdAsync(1))
                .ReturnsAsync(prescription);
            _dentistRepoMock.Setup(x => x.GetDentistByUserIdAsync(99))
                .ReturnsAsync((Dentist)null);

            var command = new ViewPatientPrescriptionCommand(1);

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
        }

        [Fact(DisplayName = "UTCID04 - Return success when dentist views valid prescription")]
        public async System.Threading.Tasks.Task UTCID04_ShouldReturnSuccess_WhenDentistValid()
        {
            SetupHttpContext("dentist", 3);

            var prescription = new Prescription
            {
                PrescriptionId = 1,
                AppointmentId = 5,
                Content = "Some content",
                CreatedAt = DateTime.UtcNow,
                Appointment = new Appointment { PatientId = 123 },
                CreateBy = 99
            };

            _prescriptionRepoMock.Setup(x => x.GetPrescriptionByPrescriptionIdAsync(1))
                .ReturnsAsync(prescription);
            _dentistRepoMock.Setup(x => x.GetDentistByUserIdAsync(99))
                .ReturnsAsync(new Dentist
                {
                    User = new User { Fullname = "Dr. House" }
                });

            var command = new ViewPatientPrescriptionCommand(1);

            var result = await _handler.Handle(command, default);

            Assert.NotNull(result);
            Assert.Equal("Dr. House", result.CreatedBy);
            Assert.Equal("Dr. House", result.UpdateBy);
            Assert.Equal(1, result.PrescriptionId);
            Assert.Equal("Some content", result.content);
        }
    }
}
