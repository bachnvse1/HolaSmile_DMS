using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Receptionist.CreateFollow_UpAppointment;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Receptionists.CreateFUAppointment
{
    public class CreateFUAppointmentHandlerTests
    {
        private readonly Mock<IHttpContextAccessor> _httpContextAccessor = new();
        private readonly Mock<IAppointmentRepository> _appointmentRepo = new();
        private readonly Mock<IPatientRepository> _patientRepo = new();
        private readonly Mock<IDentistRepository> _dentistRepo = new();
        private readonly CreateFUAppointmentHandle _handler;

        public CreateFUAppointmentHandlerTests()
        {
            _handler = new CreateFUAppointmentHandle(_appointmentRepo.Object, _httpContextAccessor.Object, _patientRepo.Object, _dentistRepo.Object);
        }

        private void SetupContext(string? role, string userId = "1")
        {
            var claims = new List<Claim>();
            if (role != null)
                claims.Add(new Claim(ClaimTypes.Role, role));
            claims.Add(new Claim(ClaimTypes.NameIdentifier, userId));
            var identity = new ClaimsIdentity(claims);
            var user = new ClaimsPrincipal(identity);
            _httpContextAccessor.Setup(x => x.HttpContext).Returns(new DefaultHttpContext { User = user });
        }

        [Fact(DisplayName = "ITCID01 - User not receptionist → throw MSG26")]
        public async System.Threading.Tasks.Task ITCID01_UnauthorizedRole_ThrowsMSG26()
        {
            SetupContext("dentist");

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new CreateFUAppointmentCommand(), default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "ITCID02 - Appointment date in past → throw MSG34")]
        public async System.Threading.Tasks.Task ITCID02_DateInPast_ThrowsMSG34()
        {
            SetupContext("receptionist");

            var command = new CreateFUAppointmentCommand
            {
                AppointmentDate = DateTime.Now.AddDays(-1)
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG34, ex.Message);
        }

        [Fact(DisplayName = "ITCID03 - Appointment today but time in past → throw MSG34")]
        public async System.Threading.Tasks.Task ITCID03_TimeInPastToday_ThrowsMSG34()
        {
            SetupContext("receptionist");

            var command = new CreateFUAppointmentCommand
            {
                AppointmentDate = DateTime.Today,
                AppointmentTime = DateTime.Now.AddMinutes(-30).TimeOfDay
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG34, ex.Message);
        }

        //[Fact(DisplayName = "ITCID04 - Dentist not found → throw 'Bác sĩ không tồn tại'")]
        //public async System.Threading.Tasks.Task ITCID04_DentistNotFound_Throws()
        //{
        //    SetupContext("receptionist");

        //    _dentistRepo.Setup(r => r.GetDentistByDentistIdAsync(1)).ReturnsAsync((new global::Dentist())null);
        //    _patientRepo.Setup(r => r.GetPatientByPatientIdAsync(It.IsAny<int>())).ReturnsAsync(new Patient()); // đảm bảo không throw tại đây


        //    var command = new CreateFUAppointmentCommand
        //    {
        //        DentistId = 1,
        //        PatientId = 2,
        //        AppointmentDate = DateTime.Now.AddDays(1),
        //        AppointmentTime = DateTime.Now.TimeOfDay
        //    };

        //    var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));

        //    Assert.Equal("Bác sĩ không tồn tại", ex.Message);
        //}

        [Fact(DisplayName = "ITCID05 - Patient not found → throw 'Bệnh nhân không tồn tại'")]
        public async System.Threading.Tasks.Task ITCID05_PatientNotFound_Throws()
        {
            SetupContext("receptionist");

            _dentistRepo.Setup(r => r.GetDentistByDentistIdAsync(1)).ReturnsAsync(new global::Dentist());
            _patientRepo.Setup(r => r.GetPatientByPatientIdAsync(2)).ReturnsAsync((Patient)null);

            var command = new CreateFUAppointmentCommand
            {
                DentistId = 1,
                PatientId = 2,
                AppointmentDate = DateTime.Now.AddDays(1),
                AppointmentTime = DateTime.Now.TimeOfDay
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));

            Assert.Equal("Bệnh nhân không tồn tại", ex.Message);
        }

        [Fact(DisplayName = "ITCID06 - Latest appointment is confirmed → throw MSG89")]
        public async System.Threading.Tasks.Task ITCID06_LatestConfirmedAppointment_ThrowsMSG89()
        {
            SetupContext("receptionist");

            _dentistRepo.Setup(r => r.GetDentistByDentistIdAsync(1)).ReturnsAsync(new global::Dentist());
            _patientRepo.Setup(r => r.GetPatientByPatientIdAsync(2)).ReturnsAsync(new Patient());
            _appointmentRepo.Setup(r => r.GetLatestAppointmentByPatientIdAsync(2)).ReturnsAsync(new Appointment
            {
                Status = "confirmed"
            });

            var command = new CreateFUAppointmentCommand
            {
                DentistId = 1,
                PatientId = 2,
                AppointmentDate = DateTime.Now.AddDays(1),
                AppointmentTime = DateTime.Now.TimeOfDay
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG89, ex.Message);
        }

        [Fact(DisplayName = "ITCID07 - Create fails → return MSG58")]
        public async System.Threading.Tasks.Task ITCID07_CreateFails_ReturnMSG58()
        {
            SetupContext("receptionist");

            _dentistRepo.Setup(r => r.GetDentistByDentistIdAsync(1)).ReturnsAsync(new global::Dentist());
            _patientRepo.Setup(r => r.GetPatientByPatientIdAsync(2)).ReturnsAsync(new Patient());
            _appointmentRepo.Setup(r => r.GetLatestAppointmentByPatientIdAsync(2)).ReturnsAsync(new Appointment { Status = "completed" });
            _appointmentRepo.Setup(r => r.CreateAppointmentAsync(It.IsAny<Appointment>())).ReturnsAsync(false);

            var command = new CreateFUAppointmentCommand
            {
                DentistId = 1,
                PatientId = 2,
                AppointmentDate = DateTime.Now.AddDays(1),
                AppointmentTime = DateTime.Now.TimeOfDay
            };

            var result = await _handler.Handle(command, default);

            Assert.Equal(MessageConstants.MSG.MSG58, result);
        }

        [Fact(DisplayName = "ITCID08 - Create success → return MSG05")]
        public async System.Threading.Tasks.Task ITCID08_CreateSuccess_ReturnMSG05()
        {
            SetupContext("receptionist");

            _dentistRepo.Setup(r => r.GetDentistByDentistIdAsync(1)).ReturnsAsync(new global::Dentist());
            _patientRepo.Setup(r => r.GetPatientByPatientIdAsync(2)).ReturnsAsync(new Patient());
            _appointmentRepo.Setup(r => r.GetLatestAppointmentByPatientIdAsync(2)).ReturnsAsync(new Appointment { Status = "completed" });
            _appointmentRepo.Setup(r => r.CreateAppointmentAsync(It.IsAny<Appointment>())).ReturnsAsync(true);

            var command = new CreateFUAppointmentCommand
            {
                DentistId = 1,
                PatientId = 2,
                AppointmentDate = DateTime.Now.AddDays(1),
                AppointmentTime = DateTime.Now.TimeOfDay,
                ReasonForFollowUp = "Follow-up for pain"
            };

            var result = await _handler.Handle(command, default);

            Assert.Equal(MessageConstants.MSG.MSG05, result);
        }
    }
}
