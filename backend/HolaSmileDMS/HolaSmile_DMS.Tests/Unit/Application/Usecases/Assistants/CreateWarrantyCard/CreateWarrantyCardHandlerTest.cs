using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.CreateWarrantyCard;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Moq;
using System.Security.Claims;
using Xunit;
using HDMS_API.Infrastructure.Persistence;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants
{
    public class CreateWarrantyCardHandlerTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly IWarrantyCardRepository _warrantyRepo;
        private readonly ITreatmentRecordRepository _treatmentRecordRepo;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly Mock<INotificationsRepository> _notificationRepoMock = new();
        private readonly CreateWarrantyCardHandler _handler;

        public CreateWarrantyCardHandlerTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _context.Database.EnsureCreated();

            _warrantyRepo = new WarrantyCardRepository(_context);
            _treatmentRecordRepo = new TreatmentRecordRepository(_context, null!);

            _handler = new CreateWarrantyCardHandler(
                _warrantyRepo,
                _treatmentRecordRepo,
                _httpContextAccessorMock.Object,
                _notificationRepoMock.Object
            );
        }

        private void SetupHttpContext(string? role, string? userId = "1")
        {
            if (role == null)
            {
                _httpContextAccessorMock.Setup(h => h.HttpContext).Returns((HttpContext?)null);
                return;
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, userId ?? "")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = principal };

            _httpContextAccessorMock.Setup(h => h.HttpContext).Returns(context);
        }

        [Fact(DisplayName = "Normal - UTCID01 - Assistant creates warranty card successfully")]
        public async System.Threading.Tasks.Task UTCID01_Assistant_Creates_WarrantyCard_Success()
        {
            // Arrange
            SetupHttpContext("Assistant", "10");

            var procedure = new Procedure
            {
                ProcedureId = 1,
                ProcedureName = "Hàn răng",
                WarrantyCardId = null
            };
            _context.Procedures.Add(procedure);

            var appointment = new Appointment { AppointmentId = 1, PatientId = 999 };
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

            var patient = new Patient { PatientID = 999, UserID = 888 };
            _context.Patients.Add(patient);

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
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - HttpContext null throws MSG53")]
        public async System.Threading.Tasks.Task UTCID02_HttpContext_Null_Throws_MSG53()
        {
            SetupHttpContext(null);

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new CreateWarrantyCardCommand { TreatmentRecordId = 1, Duration = 12 }, default));

            Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Role is not Assistant throws MSG26")]
        public async System.Threading.Tasks.Task UTCID03_Role_Not_Assistant_Throws_MSG26()
        {
            SetupHttpContext("Patient");

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new CreateWarrantyCardCommand { TreatmentRecordId = 1, Duration = 12 }, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID04 - Treatment record not found throws MSG101")]
        public async System.Threading.Tasks.Task UTCID04_Treatment_Not_Found()
        {
            SetupHttpContext("Assistant");

            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(new CreateWarrantyCardCommand { TreatmentRecordId = 999, Duration = 12 }, default));

            Assert.Equal(MessageConstants.MSG.MSG101, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID05 - Treatment not completed throws MSG101")]
        public async System.Threading.Tasks.Task UTCID05_Treatment_Not_Completed()
        {
            SetupHttpContext("Assistant");

            var appointment = new Appointment { AppointmentId = 2, PatientId = 1000 };
            _context.Appointments.Add(appointment);

            var procedure = new Procedure { ProcedureId = 2 };
            _context.Procedures.Add(procedure);

            var tr = new TreatmentRecord
            {
                TreatmentRecordID = 2,
                AppointmentID = 2,
                ProcedureID = 2,
                TreatmentStatus = "InProgress",
                Appointment = appointment,
                Procedure = procedure
            };
            _context.TreatmentRecords.Add(tr);

            await _context.SaveChangesAsync();

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _handler.Handle(new CreateWarrantyCardCommand { TreatmentRecordId = 2, Duration = 12 }, default));

            Assert.Equal(MessageConstants.MSG.MSG101, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID06 - Procedure already has warranty throws MSG100")]
        public async System.Threading.Tasks.Task UTCID06_Procedure_Already_Has_Warranty()
        {
            // Arrange
            SetupHttpContext("Assistant");

            var procedure = new Procedure { ProcedureId = 3 };
            _context.Procedures.Add(procedure);

            var appointment = new Appointment { AppointmentId = 3, PatientId = 1 };
            _context.Appointments.Add(appointment);

            var tr = new TreatmentRecord
            {
                TreatmentRecordID = 3,
                AppointmentID = 3,
                ProcedureID = 3,
                TreatmentStatus = "Completed",
                Appointment = appointment,
                Procedure = procedure
            };
            _context.TreatmentRecords.Add(tr);

            var existingWarranty = new WarrantyCard
            {
                WarrantyCardID = 99,
                TreatmentRecordID = 3, // Gắn đúng với treatment
                StartDate = DateTime.Now,
                EndDate = DateTime.Now.AddMonths(12),
                Duration = 12,
                Status = true,
                CreateBy = 1
            };
            _context.WarrantyCards.Add(existingWarranty);

            await _context.SaveChangesAsync();

            var command = new CreateWarrantyCardCommand { TreatmentRecordId = 3, Duration = 12 };

            // Act + Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG100, ex.Message);
        }


        [Fact(DisplayName = "Abnormal - UTCID07 - Duration <= 0 throws MSG98")]
        public async System.Threading.Tasks.Task UTCID07_Duration_Zero_Throws()
        {
            SetupHttpContext("Assistant");

            var procedure = new Procedure { ProcedureId = 4 };
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

            var ex = await Assert.ThrowsAsync<FormatException>(() =>
                _handler.Handle(new CreateWarrantyCardCommand { TreatmentRecordId = 4, Duration = 0 }, default));

            Assert.Equal(MessageConstants.MSG.MSG98, ex.Message);
        }

        public void Dispose()
        {
            _context?.Dispose();
        }
    }
}
