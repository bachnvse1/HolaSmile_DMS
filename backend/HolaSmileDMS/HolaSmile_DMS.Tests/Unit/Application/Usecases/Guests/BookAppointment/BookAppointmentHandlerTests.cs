using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using AutoMapper;
using HDMS_API.Application.Usecases.Guests.BookAppointment;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Guests.BookAppointment
{
    public class BookAppointmentHandlerTests
    {
        private readonly Mock<IHttpContextAccessor> _httpContextAccessor = new();
        private readonly Mock<IAppointmentRepository> _appointmentRepo = new();
        private readonly Mock<IUserCommonRepository> _userCommonRepo = new();
        private readonly Mock<IPatientRepository> _patientRepo = new();
        private readonly Mock<IDentistRepository> _dentistRepo = new();
        private readonly Mock<IMapper> _mapper = new();
        private readonly Mock<IMediator> _mediator = new();
        private readonly BookAppointmentHandler _handler;

        public BookAppointmentHandlerTests()
        {
            _handler = new BookAppointmentHandler(
                _appointmentRepo.Object,
                _mediator.Object,
                _patientRepo.Object,
                _userCommonRepo.Object,
                _mapper.Object,
                _dentistRepo.Object,
                _httpContextAccessor.Object
                );
        }

        private void SetupContext(string? role, string userId = "1")
        {
            var claims = new List<Claim>();
            if (role != null)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }
            claims.Add(new Claim(ClaimTypes.NameIdentifier, userId));
            var identity = new ClaimsIdentity(claims);
            var user = new ClaimsPrincipal(identity);
            _httpContextAccessor.Setup(x => x.HttpContext).Returns(new DefaultHttpContext { User = user });
        }


        [Fact(DisplayName = "UTCID08 - Appointment in the past → throw MSG74")]
        public async System.Threading.Tasks.Task UTCID08_PastAppointment_ThrowsMSG74()
        {
            SetupContext("patient");
            var command = new BookAppointmentCommand { AppointmentDate = DateTime.Now.AddDays(-1), AppointmentTime = DateTime.Now.TimeOfDay };
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG74, ex.Message);
        }

        [Fact(DisplayName = "UTCID09 - Invalid role → throw MSG26")]
        public async System.Threading.Tasks.Task UTCID09_InvalidRole_ThrowsMSG26()
        {
            SetupContext("admin");
            var command = new BookAppointmentCommand { AppointmentDate = DateTime.Now.AddDays(1), AppointmentTime = DateTime.Now.TimeOfDay };
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID10 - CreatePatientAccountAsync returns null → throw MSG76")]
        public async System.Threading.Tasks.Task UTCID10_CreatePatientAccountFails_ThrowsMSG76()
        {
            SetupContext(null);
            _mapper.Setup(m => m.Map<CreatePatientDto>(It.IsAny<BookAppointmentCommand>())).Returns(new CreatePatientDto());
            _userCommonRepo.Setup(r => r.CreatePatientAccountAsync(It.IsAny<CreatePatientDto>(), It.IsAny<string>())).ReturnsAsync((User)null);

            var command = new BookAppointmentCommand { AppointmentDate = DateTime.Now.AddDays(1), AppointmentTime = DateTime.Now.TimeOfDay };
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG76, ex.Message);
        }

        [Fact(DisplayName = "UTCID11 - CreatePatientAsync returns null → throw MSG77")]
        public async System.Threading.Tasks.Task UTCID11_CreatePatientFails_ThrowsMSG77()
        {
            SetupContext(null);
            var guest = new CreatePatientDto();
            var newUser = new User { UserID = 5, Email = "guest@mail.com" };
            _mapper.Setup(m => m.Map<CreatePatientDto>(It.IsAny<BookAppointmentCommand>())).Returns(guest);
            _userCommonRepo.Setup(r => r.CreatePatientAccountAsync(guest, It.IsAny<string>())).ReturnsAsync(newUser);
            _patientRepo.Setup(r => r.CreatePatientAsync(guest, newUser.UserID)).ReturnsAsync((Patient)null);

            var command = new BookAppointmentCommand { AppointmentDate = DateTime.Now.AddDays(1), AppointmentTime = DateTime.Now.TimeOfDay };
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG77, ex.Message);
        }

        [Fact(DisplayName = "UTCID12 - Patient not found → throw MSG27")]
        public async System.Threading.Tasks.Task UTCID12_PatientNotFound_ThrowsMSG27()
        {
            SetupContext("patient", "1");
            _patientRepo.Setup(r => r.GetPatientByUserIdAsync(1)).ReturnsAsync((Patient)null);

            var command = new BookAppointmentCommand { AppointmentDate = DateTime.Now.AddDays(1), AppointmentTime = DateTime.Now.TimeOfDay };
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG27, ex.Message);
        }

        [Fact(DisplayName = "UTCID13 - Appointment already exists → throw MSG89")]
        public async System.Threading.Tasks.Task UTCID13_AppointmentExists_ThrowsMSG89()
        {
            SetupContext("patient", "1");
            var patient = new Patient { PatientID = 1, User = new User { UserID = 1 } };
            _patientRepo.Setup(r => r.GetPatientByUserIdAsync(1)).ReturnsAsync(patient);
            _appointmentRepo.Setup(r => r.GetLatestAppointmentByPatientIdAsync(1)).ReturnsAsync(new Appointment { Status = "confirmed" });

            var command = new BookAppointmentCommand { AppointmentDate = DateTime.Now.AddDays(1), AppointmentTime = DateTime.Now.TimeOfDay };
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG89, ex.Message);
        }

        [Fact(DisplayName = "UTCID14 - Book appointment successfully → return MSG58")]
        public async System.Threading.Tasks.Task UTCID15_BookSuccessfully_ReturnMSG58()
        {
            SetupContext("patient", "1");

            var patient = new Patient { PatientID = 1, User = new User { UserID = 1 } };
            var dentist = new Dentist { DentistId = 2, User = new User { UserID = 2 } };
            var receptionists = new List<Receptionist> { new Receptionist { ReceptionistId = 3 }};
            var existingAppointment = new Appointment {AppointmentId = 1, PatientId = 1, DentistId =2, Status = "canceled" };

            _patientRepo.Setup(r => r.GetPatientByUserIdAsync(1)).ReturnsAsync(patient);
            _appointmentRepo.Setup(r => r.GetLatestAppointmentByPatientIdAsync(1)).ReturnsAsync((Appointment)null);
            _appointmentRepo.Setup(r => r.CreateAppointmentAsync(It.IsAny<Appointment>())).ReturnsAsync(true);
            _dentistRepo.Setup(r => r.GetDentistByDentistIdAsync(It.IsAny<int>())).ReturnsAsync(dentist);
            _userCommonRepo.Setup(r => r.GetAllReceptionistAsync()).ReturnsAsync(receptionists);

            var command = new BookAppointmentCommand
            {
                AppointmentDate = DateTime.Now.AddDays(1),
                AppointmentTime = DateTime.Now.TimeOfDay,
                DentistId = 2,
                MedicalIssue = "Toothache"
            };

            var result = await _handler.Handle(command, default);
            Assert.Equal(MessageConstants.MSG.MSG05, result);
        }


        [Fact(DisplayName = "UTCID15 - Book appointment successfully → return MSG58")]
        public async System.Threading.Tasks.Task UTCID14_BookSuccessfully_ReturnMSG58()
        {
            SetupContext(null);

            var guest = new CreatePatientDto();
            var newUser = new User { UserID = 5, Email = "guest@mail.com" };
            var patient = new Patient { PatientID = 1, User = newUser };
            var dentist = new Dentist {DentistId = 2, User = new User { UserID = 2 } };
            var receptionists = new List<Receptionist> { new Receptionist { ReceptionistId = 3 } };

            _mapper.Setup(m => m.Map<CreatePatientDto>(It.IsAny<BookAppointmentCommand>())).Returns(guest);
            _userCommonRepo.Setup(r => r.CreatePatientAccountAsync(guest, It.IsAny<string>())).ReturnsAsync(newUser);
            _userCommonRepo.Setup(r => r.SendPasswordForGuestAsync(It.IsAny<string>())).ReturnsAsync(true);
            _patientRepo.Setup(r => r.CreatePatientAsync(guest, newUser.UserID)).ReturnsAsync(patient);
            _appointmentRepo.Setup(r => r.CreateAppointmentAsync(It.IsAny<Appointment>())).ReturnsAsync(true);
            _appointmentRepo.Setup(r => r.GetLatestAppointmentByPatientIdAsync(It.IsAny<int>())).ReturnsAsync((Appointment)null);
            _dentistRepo.Setup(r => r.GetDentistByDentistIdAsync(It.IsAny<int>())).ReturnsAsync(dentist);
            _userCommonRepo.Setup(r => r.GetAllReceptionistAsync()).ReturnsAsync(receptionists);

            var command = new BookAppointmentCommand
            {
                AppointmentDate = DateTime.Now.AddDays(1),
                AppointmentTime = DateTime.Now.TimeOfDay,
                DentistId = 2,
                MedicalIssue = "Toothache"
            };

            var result = await _handler.Handle(command, default);
            Assert.Equal(MessageConstants.MSG.MSG05, result);
        }
    }
}
