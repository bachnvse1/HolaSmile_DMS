using Application.Constants;
using Application.Usecases.Assistants.CreatePatientDentalImage;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.Security.Claims;
using Xunit;
using Application.Interfaces;
using AutoMapper;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants
{
    public class CreatePatientDentalImageIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly Mock<ICloudinaryService> _mockCloudService;
        private readonly CreatePatientDentalImageHandler _handler;

        public CreatePatientDentalImageIntegrationTests()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("CreatePatientDentalImageDb"));

            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();

            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            _mockCloudService = new Mock<ICloudinaryService>();
            _mockCloudService
                .Setup(x => x.UploadImageAsync(It.IsAny<IFormFile>(), It.IsAny<string>()))
                .ReturnsAsync("https://cloud.fake/image.jpg");

            var mockMapper = new Mock<IMapper>();

            var patientRepo = new PatientRepository(_context);
            var imageRepo = new ImageRepository(_context);
            var treatmentRecordRepo = new TreatmentRecordRepository(_context, mockMapper.Object);
            var orthoPlanRepo = new OrthodonticTreatmentPlanRepository(_context, mockMapper.Object);

            _handler = new CreatePatientDentalImageHandler(
                patientRepo, imageRepo, _mockCloudService.Object,
                _httpContextAccessor, treatmentRecordRepo, orthoPlanRepo);

            SeedData();
        }

        private void SetupHttpContext(string role)
        {
            var context = new DefaultHttpContext();
            context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "1"),
                new Claim(ClaimTypes.Role, role)
            }, "TestAuth"));

            _httpContextAccessor.HttpContext = context;
        }

        private void SeedData()
        {
            _context.Images.RemoveRange(_context.Images);
            _context.Patients.RemoveRange(_context.Patients);
            _context.TreatmentRecords.RemoveRange(_context.TreatmentRecords);
            _context.Appointments.RemoveRange(_context.Appointments);
            _context.Dentists.RemoveRange(_context.Dentists);
            _context.Procedures.RemoveRange(_context.Procedures);
            _context.OrthodonticTreatmentPlans.RemoveRange(_context.OrthodonticTreatmentPlans);
            _context.SaveChanges();

            _context.Patients.Add(new Patient { PatientID = 10, UserID = 100 });
            _context.Dentists.Add(new Dentist { DentistId = 2, UserId = 200 });
            _context.Procedures.Add(new Procedure { ProcedureId = 1, ProcedureName = "Test" });

            _context.Appointments.Add(new Appointment
            {
                AppointmentId = 100,
                PatientId = 10,
                DentistId = 2,
                AppointmentDate = DateTime.Today,
                AppointmentTime = new TimeSpan(9, 0, 0),
                CreatedAt = DateTime.Now
            });

            _context.TreatmentRecords.Add(new TreatmentRecord
            {
                TreatmentRecordID = 20,
                AppointmentID = 100,
                DentistID = 2,
                ProcedureID = 1,
                TreatmentDate = DateTime.Today,
                Quantity = 1,
                UnitPrice = 500000,
                TotalAmount = 500000,
                CreatedAt = DateTime.Now
            });

            _context.OrthodonticTreatmentPlans.Add(new OrthodonticTreatmentPlan
            {
                PlanId = 30,
                PatientId = 10
            });

            _context.SaveChanges();
        }

        private IFormFile CreateMockImageFile(string contentType = "image/jpeg")
        {
            var stream = new MemoryStream(new byte[] { 1, 2, 3 });
            return new FormFile(stream, 0, stream.Length, "image", "x.jpg")
            {
                Headers = new HeaderDictionary(),
                ContentType = contentType
            };
        }

        [Fact(DisplayName = "Normal - UTCID01 - Create with TreatmentRecordId succeeds")]
        public async System.Threading.Tasks.Task UTCID01_Create_With_TreatmentRecordId_Success()
        {
            SetupHttpContext("Assistant");

            var command = new CreatePatientDentalImageCommand
            {
                PatientId = 10,
                Description = "Test image",
                ImageFile = CreateMockImageFile(),
                TreatmentRecordId = 20
            };

            var result = await _handler.Handle(command, default);

            Assert.Equal(MessageConstants.MSG.MSG113, result);
            var img = _context.Images.FirstOrDefault(x => x.PatientId == 10);
            Assert.NotNull(img);
            Assert.Equal(20, img.TreatmentRecordId);
            Assert.Null(img.OrthodonticTreatmentPlanId);
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - Invalid role throws MSG26")]
        public async System.Threading.Tasks.Task UTCID02_InvalidRole_Throws()
        {
            SetupHttpContext("Receptionist");

            var command = new CreatePatientDentalImageCommand
            {
                PatientId = 10,
                ImageFile = CreateMockImageFile(),
                TreatmentRecordId = 20
            };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Invalid image format throws")]
        public async System.Threading.Tasks.Task UTCID03_InvalidImageFormat_Throws()
        {
            SetupHttpContext("Assistant");

            var command = new CreatePatientDentalImageCommand
            {
                PatientId = 10,
                Description = "Invalid format",
                ImageFile = CreateMockImageFile("application/pdf"),
                TreatmentRecordId = 20
            };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
                _handler.Handle(command, default));

            Assert.Contains("định dạng", ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID04 - Both treatment and ortho plan provided throws")]
        public async System.Threading.Tasks.Task UTCID04_BothRelationIdsProvided_Throws()
        {
            SetupHttpContext("Assistant");

            var command = new CreatePatientDentalImageCommand
            {
                PatientId = 10,
                Description = "Test",
                ImageFile = CreateMockImageFile(),
                TreatmentRecordId = 20,
                OrthodonticTreatmentPlanId = 30
            };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
                _handler.Handle(command, default));

            Assert.Contains("Chỉ được chọn một", ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID05 - None relation provided throws")]
        public async System.Threading.Tasks.Task UTCID05_NoRelationProvided_Throws()
        {
            SetupHttpContext("Assistant");

            var command = new CreatePatientDentalImageCommand
            {
                PatientId = 10,
                ImageFile = CreateMockImageFile()
            };

            var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
                _handler.Handle(command, default));

            Assert.Contains("cần chọn", ex.Message);
        }
    }
}
