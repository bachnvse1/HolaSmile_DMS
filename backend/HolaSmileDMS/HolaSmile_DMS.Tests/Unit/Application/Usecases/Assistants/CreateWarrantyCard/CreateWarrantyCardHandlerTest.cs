using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.CreateWarrantyCard;
using Application.Usecases.SendNotification;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants
{
    public class CreateWarrantyCardHandlerTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly IWarrantyCardRepository _warrantyRepo;
        private readonly ITreatmentRecordRepository _treatmentRecordRepo;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly Mock<IMediator> _mediatorMock = new();
        private readonly CreateWarrantyCardHandler _handler;
        private readonly Mock<INotificationsRepository> _notificationRepoMock;

        public CreateWarrantyCardHandlerTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _context.Database.EnsureCreated();

            _warrantyRepo = new WarrantyCardRepository(_context);
            _treatmentRecordRepo = new TreatmentRecordRepository(_context, null!);
            _notificationRepoMock = new Mock<INotificationsRepository>();

            // Setup mediator mock
            _mediatorMock
                .Setup(x => x.Send(It.IsAny<SendNotificationCommand>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MediatR.Unit.Value);

            _handler = new CreateWarrantyCardHandler(
                _warrantyRepo,
                _treatmentRecordRepo,
                _httpContextAccessorMock.Object,
                _notificationRepoMock.Object,
                _mediatorMock.Object
            );
        }

        private void SetupHttpContext(string? role, string? userId = "1", string fullName = "Test Assistant")
        {
            if (role == null)
            {
                _httpContextAccessorMock.Setup(h => h.HttpContext).Returns((HttpContext?)null);
                return;
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, userId ?? ""),
                new Claim(ClaimTypes.GivenName, fullName)
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = principal };

            _httpContextAccessorMock.Setup(h => h.HttpContext).Returns(context);
        }

        // ----------------- TEST CASES -----------------

        [Fact(DisplayName = "Normal - UTCID01 - Assistant creates warranty card successfully")]
        public async System.Threading.Tasks.Task UTCID01_Assistant_Creates_WarrantyCard_Success()
        {
            // Arrange
            SetupHttpContext("Assistant", "10", "Test Assistant");

            var user = new User
            {
                UserID = 888,
                Fullname = "Test Patient",
                Username = "patient888",
                Phone = "0111111111",
                Status = true
            };
            _context.Users.Add(user);

            var patient = new Patient { PatientID = 999, UserID = 888, User = user };
            _context.Patients.Add(patient);

            var procedure = new Procedure
            {
                ProcedureId = 1,
                ProcedureName = "Hàn răng",
            };
            _context.Procedures.Add(procedure);

            var appointment = new Appointment { AppointmentId = 1, PatientId = 999, Patient = patient };
            _context.Appointments.Add(appointment);

            var treatmentRecord = new TreatmentRecord
            {
                TreatmentRecordID = 1,
                ProcedureID = 1,
                AppointmentID = 1,
                Appointment = appointment,
                TreatmentStatus = "Completed",
                IsDeleted = false
            };
            _context.TreatmentRecords.Add(treatmentRecord);

            await _context.SaveChangesAsync();

            var command = new CreateWarrantyCardCommand
            {
                TreatmentRecordId = 1,
                Duration = 12
            };

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(12, result.Duration);
            Assert.True(result.WarrantyCardId > 0);

            _mediatorMock.Verify(m => m.Send(
                It.Is<SendNotificationCommand>(n =>
                    n.UserId == 888 &&
                    n.Title == "Thẻ bảo hành đã được tạo" &&
                    n.Type == "Create" &&
                    n.MappingUrl == $"/patient/warranty-cards/{result.WarrantyCardId}"
                ),
                It.IsAny<CancellationToken>()
            ), Times.Once);
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - Không đăng nhập throws MSG53")]
        public async System.Threading.Tasks.Task UTCID02_NotLoggedIn_Throws_MSG53()
        {
            // Arrange
            SetupHttpContext(null); // không đăng nhập

            var command = new CreateWarrantyCardCommand
            {
                TreatmentRecordId = 1,
                Duration = 12
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Role không hợp lệ throws MSG26")]
        public async System.Threading.Tasks.Task UTCID03_InvalidRole_Throws_MSG26()
        {
            // Arrange
            SetupHttpContext("Receptionist"); // role không được phép

            var command = new CreateWarrantyCardCommand
            {
                TreatmentRecordId = 1,
                Duration = 12
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Abnormal - UTCID04 - Treatment record không tồn tại throws MSG99")]
        public async System.Threading.Tasks.Task UTCID04_RecordNotFound_Throws_MSG99()
        {
            // Arrange
            SetupHttpContext("Assistant");

            var command = new CreateWarrantyCardCommand
            {
                TreatmentRecordId = 999, // không tồn tại
                Duration = 12
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG99, ex.Message);

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Abnormal - UTCID05 - Treatment record chưa hoàn tất throws MSG101")]
        public async System.Threading.Tasks.Task UTCID05_Record_NotCompleted_Throws_MSG101()
        {
            // Arrange
            SetupHttpContext("Assistant");

            // Tạo dữ liệu TreatmentRecord chưa Completed
            var user = new User
            {
                UserID = 1001,
                Fullname = "Patient X",
                Username = "patientx",
                Phone = "0123456789",
                Status = true
            };
            _context.Users.Add(user);

            var patient = new Patient { PatientID = 1001, UserID = 1001, User = user };
            _context.Patients.Add(patient);

            var appointment = new Appointment { AppointmentId = 1001, PatientId = 1001, Patient = patient };
            _context.Appointments.Add(appointment);

            var procedure = new Procedure
            {
                ProcedureId = 500,
                ProcedureName = "Nhổ răng"
            };
            _context.Procedures.Add(procedure);

            var tr = new TreatmentRecord
            {
                TreatmentRecordID = 1001,
                AppointmentID = 1001,
                TreatmentStatus = "In-Progress", // chưa hoàn tất
                Appointment = appointment,
                ProcedureID = 500,
                Procedure = procedure
            };
            _context.TreatmentRecords.Add(tr);

            _context.TreatmentRecords.Add(tr);

            await _context.SaveChangesAsync();

            var command = new CreateWarrantyCardCommand
            {
                TreatmentRecordId = 1001,
                Duration = 12
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG101, ex.Message);

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Abnormal - UTCID06 - Duration không hợp lệ throws MSG98")]
        public async System.Threading.Tasks.Task UTCID06_InvalidTerm_Throws_MSG98()
        {
            // Arrange
            SetupHttpContext("Assistant");

            // Tạo dữ liệu TreatmentRecord Completed
            var user = new User
            {
                UserID = 2001,
                Fullname = "Patient Y",
                Username = "patienty",
                Phone = "0999999999",
                Status = true
            };
            _context.Users.Add(user);

            var patient = new Patient { PatientID = 2001, UserID = 2001, User = user };
            _context.Patients.Add(patient);

            var appointment = new Appointment { AppointmentId = 2001, PatientId = 2001, Patient = patient };
            _context.Appointments.Add(appointment);

            var procedure = new Procedure
            {
                ProcedureId = 100,
                ProcedureName = "Nhổ răng"
            };
            _context.Procedures.Add(procedure);

            var tr = new TreatmentRecord
            {
                TreatmentRecordID = 2001,
                AppointmentID = 2001,
                TreatmentStatus = "Completed",
                Appointment = appointment,
                ProcedureID = 100,
                Procedure = procedure
            };
            _context.TreatmentRecords.Add(tr);

            await _context.SaveChangesAsync();

            var command = new CreateWarrantyCardCommand
            {
                TreatmentRecordId = 2001,
                Duration =0
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<FormatException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG98, ex.Message);

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Abnormal - UTCID07 - Duration <= 0 throws MSG98")]
        public async System.Threading.Tasks.Task UTCID07_Duration_Zero_Throws_MSG98()
        {
            // Arrange
            SetupHttpContext("Assistant");

            var procedure = new Procedure { ProcedureId = 4, ProcedureName = "Trám răng" };
            _context.Procedures.Add(procedure);

            var appointment = new Appointment { AppointmentId = 4, PatientId = 4 };
            _context.Appointments.Add(appointment);

            var tr = new TreatmentRecord
            {
                TreatmentRecordID = 4,
                AppointmentID = 4,
                ProcedureID = 4,
                TreatmentStatus = "Completed",
                Appointment = appointment,
                Procedure = procedure
            };
            _context.TreatmentRecords.Add(tr);

            await _context.SaveChangesAsync();

            var command = new CreateWarrantyCardCommand
            {
                TreatmentRecordId = 4,
                Duration = 0
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<FormatException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG98, ex.Message);

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        public void Dispose()
        {
            _context?.Dispose();
        }
    }
}
