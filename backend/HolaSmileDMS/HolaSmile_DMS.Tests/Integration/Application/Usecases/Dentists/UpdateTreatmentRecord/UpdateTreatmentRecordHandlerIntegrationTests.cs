using Application.Usecases.Dentist.UpdateTreatmentRecord;
using Application.Usecases.SendNotification;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Dentists
{
    public class UpdateTreatmentRecordHandlerIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly UpdateTreatmentRecordHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly Mock<IMediator> _mediatorMock;
        private readonly TreatmentRecordRepository _treatmentRecordRepository;

        public UpdateTreatmentRecordHandlerIntegrationTests()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("UpdateTreatmentRecordTestDb"));

            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();

            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();
            _mediatorMock = new Mock<IMediator>();

            _treatmentRecordRepository = new TreatmentRecordRepository(_context, null!);

            _handler = new UpdateTreatmentRecordHandler(
                _treatmentRecordRepository,
                _httpContextAccessor,
                _mediatorMock.Object
            );

            _mediatorMock
                .Setup(x => x.Send(It.IsAny<SendNotificationCommand>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MediatR.Unit.Value);

            SeedData();
        }

        private void SetupHttpContext(string role, int userId, string fullName = "Dentist Test")
        {
            var context = new DefaultHttpContext();
            context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.GivenName, fullName)
            }, "TestAuth"));

            _httpContextAccessor.HttpContext = context;
        }

        private void SeedData()
        {
            // Clear old data
            _context.Users.RemoveRange(_context.Users);
            _context.Patients.RemoveRange(_context.Patients);
            _context.Dentists.RemoveRange(_context.Dentists);
            _context.Appointments.RemoveRange(_context.Appointments);
            _context.TreatmentRecords.RemoveRange(_context.TreatmentRecords);
            _context.SaveChanges();

            // Create Users
            var patientUser = new User { UserID = 1, Username = "0111111111", Fullname = "Patient A", Phone = "0111111111" };
            var dentistUser = new User { UserID = 2, Username = "0111111112", Fullname = "Dentist B", Phone = "0111111112" };
            _context.Users.AddRange(patientUser, dentistUser);

            // Create Patient & Dentist
            var patientEntity = new Patient { PatientID = 1, UserID = 1, User = patientUser };
            _context.Patients.Add(patientEntity);
            _context.Dentists.Add(new Dentist { DentistId = 1, UserId = 2 });

            // Create Appointment
            var appointment = new Appointment
            {
                AppointmentId = 1,
                PatientId = 1,
                Patient = patientEntity
            };
            _context.Appointments.Add(appointment);

            // Create Treatment Record
            _context.TreatmentRecords.Add(new TreatmentRecord
            {
                TreatmentRecordID = 100,
                Appointment = appointment,
                ToothPosition = "M1",
                Quantity = 1,
                UnitPrice = 100000,
                TotalAmount = 100000,
                TreatmentStatus = "Pending",
                CreatedAt = DateTime.Now.AddDays(-1),
                CreatedBy = 2,
                IsDeleted = false
            });

            _context.SaveChanges();
        }

        // ---------- TEST CASES ----------

        [Fact(DisplayName = "Normal - UTCID01 - Dentist cập nhật hồ sơ điều trị thành công")]
        public async System.Threading.Tasks.Task Normal_UTCID01_Dentist_Updates_Record_Success()
        {
            // Arrange
            SetupHttpContext("Dentist", 2);

            var command = new UpdateTreatmentRecordCommand
            {
                TreatmentRecordId = 100,
                ToothPosition = "M2",
                Quantity = 2,
                UnitPrice = 150000,
                TotalAmount = 300000,
                TreatmentStatus = "Completed"
            };

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.True(result);

            var updatedRecord = await _context.TreatmentRecords
                .Include(tr => tr.Appointment)
                .ThenInclude(a => a.Patient)
                .ThenInclude(p => p.User)
                .FirstOrDefaultAsync(tr => tr.TreatmentRecordID == 100);

            Assert.NotNull(updatedRecord);
            Assert.Equal("M2", updatedRecord.ToothPosition);
            Assert.Equal(2, updatedRecord.Quantity);
            Assert.Equal(150000, updatedRecord.UnitPrice);
            Assert.Equal("Completed", updatedRecord.TreatmentStatus);

            _mediatorMock.Verify(m => m.Send(
                It.Is<SendNotificationCommand>(n =>
                    n.UserId == 1 &&
                    n.Title == "Cập nhật hồ sơ điều trị" &&
                    n.Type == "Update"
                ),
                It.IsAny<CancellationToken>()
            ), Times.Once);
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - Non-Dentist hoặc Non-Assistant không thể cập nhật")]
        public async System.Threading.Tasks.Task Abnormal_UTCID02_NonDentist_Cannot_Update()
        {
            // Arrange
            SetupHttpContext("Receptionist", 2);

            var command = new UpdateTreatmentRecordCommand
            {
                TreatmentRecordId = 100,
                ToothPosition = "M3"
            };

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Record không tồn tại sẽ throw KeyNotFoundException")]
        public async System.Threading.Tasks.Task Abnormal_UTCID03_RecordNotFound_Throws()
        {
            // Arrange
            SetupHttpContext("Dentist", 2);

            var command = new UpdateTreatmentRecordCommand
            {
                TreatmentRecordId = 999, // không tồn tại
                ToothPosition = "M4"
            };

            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Normal - UTCID04 - Dentist cập nhật một phần thông tin thành công")]
        public async System.Threading.Tasks.Task Normal_UTCID04_Dentist_Partial_Update_Success()
        {
            // Arrange
            SetupHttpContext("Dentist", 2);

            var command = new UpdateTreatmentRecordCommand
            {
                TreatmentRecordId = 100,
                Quantity = 5 // chỉ update số lượng
            };

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.True(result);

            var updatedRecord = await _context.TreatmentRecords
                .FirstOrDefaultAsync(tr => tr.TreatmentRecordID == 100);

            Assert.NotNull(updatedRecord);
            Assert.Equal(5, updatedRecord.Quantity); // updated field
            Assert.Equal("M1", updatedRecord.ToothPosition); // giữ nguyên field cũ
        }
    }
}
