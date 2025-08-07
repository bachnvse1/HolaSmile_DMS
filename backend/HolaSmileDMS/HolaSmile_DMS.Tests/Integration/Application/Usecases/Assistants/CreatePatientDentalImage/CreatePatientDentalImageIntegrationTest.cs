using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistants.CreatePatientDentalImage;
using Application.Usecases.SendNotification;
using AutoMapper;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Infrastructure.Repositories;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants
{
    public class CreatePatientDentalImageIntegrationTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly Mock<ICloudinaryService> _mockCloudService;
        private readonly Mock<IMediator> _mockMediator;
        private readonly CreatePatientDentalImageHandler _handler;

        public CreatePatientDentalImageIntegrationTests()
        {
            var services = new ServiceCollection();
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase($"CreatePatientDentalImageDb_{Guid.NewGuid()}"));
            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            // Setup Cloudinary mock
            _mockCloudService = new Mock<ICloudinaryService>();
            _mockCloudService
                .Setup(x => x.UploadImageAsync(It.IsAny<IFormFile>(), It.IsAny<string>()))
                .ReturnsAsync("https://cloud.fake/image.jpg");

            // Setup Mediator mock với cú pháp đúng
            _mockMediator = new Mock<IMediator>();
            _mockMediator
                .Setup(x => x.Send(It.IsAny<SendNotificationCommand>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MediatR.Unit.Value);

            var mockMapper = new Mock<IMapper>();
            var patientRepo = new PatientRepository(_context);
            var imageRepo = new ImageRepository(_context);
            var treatmentRecordRepo = new TreatmentRecordRepository(_context, mockMapper.Object);
            var orthoPlanRepo = new OrthodonticTreatmentPlanRepository(_context, mockMapper.Object);

            _handler = new CreatePatientDentalImageHandler(
                patientRepo,
                imageRepo,
                _mockCloudService.Object,
                _httpContextAccessor,
                treatmentRecordRepo,
                orthoPlanRepo,
                _mockMediator.Object);  // Inject mediator mock

            SeedData();
        }

        private void SetupHttpContext(string role, string fullName = "Test User")
        {
            var context = new DefaultHttpContext();
            context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.GivenName, fullName)
        }, "TestAuth"));

            _httpContextAccessor.HttpContext = context;
        }

        private void SeedData()
        {
            _context.Database.EnsureDeleted();

            _context.Users.Add(new User
            {
                UserID = 100,
                Username = "patient1",  // Thêm trường bắt buộc
                Phone = "0123456789",  // Thêm trường bắt buộc
                Fullname = "Test Patient",
                Status = true,
                CreatedAt = DateTime.Now  // Nếu cần
            });

            // Thêm user cho dentist nếu cần thiết
            _context.Users.Add(new User
            {
                UserID = 200,
                Username = "dentist1",
                Phone = "0987654321",
                Fullname = "Test Dentist",
                Status = true,
                CreatedAt = DateTime.Now
            });

            _context.Patients.Add(new Patient
            {
                PatientID = 10,
                UserID = 100,
                CreatedAt = DateTime.Now
            });

            _context.Dentists.Add(new Dentist
            {
                DentistId = 2,
                UserId = 200
            });

            _context.Procedures.Add(new Procedure
            {
                ProcedureId = 1,
                ProcedureName = "Test"
            });

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
            return new FormFile(stream, 0, stream.Length, "Media", "test.jpg")
            {
                Headers = new HeaderDictionary(),
                ContentType = contentType
            };
        }

        [Fact(DisplayName = "Normal - UTCID01 - Tạo ảnh nha khoa với TreatmentRecordId thành công")]
        public async System.Threading.Tasks.Task Normal_UTCID01_CreateWithTreatmentRecord_Success()
        {
            // Arrange
            SetupHttpContext("Assistant", "Assistant Name");

            var command = new CreatePatientDentalImageCommand
            {
                PatientId = 10,
                Description = "Test image",
                ImageFile = CreateMockImageFile(),
                TreatmentRecordId = 20
            };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG113, result);

            var image = await _context.Images
                .Include(x => x.TreatmentRecord)
                .FirstOrDefaultAsync(x => x.PatientId == 10);

            Assert.NotNull(image);
            Assert.Equal(20, image.TreatmentRecordId);
            Assert.Null(image.OrthodonticTreatmentPlanId);
            Assert.Equal("https://cloud.fake/image.jpg", image.ImageURL);
            Assert.Equal("Test image", image.Description);
            Assert.False(image.IsDeleted);

            // Verify notification - sử dụng Callback để kiểm tra chính xác notification
            _mockMediator.Verify(m => m.Send(
                It.Is<SendNotificationCommand>(n =>
                    n.UserId == 100
                    && n.Title == "Tạo ảnh nha khoa"
                    && n.Message == "Một ảnh nha khoa mới đã được thêm vào hồ sơ của bạn bởi Assistant Name."
                    && n.Type == "Create"
                    && string.Equals(n.MappingUrl, "patient/treatment-records/20/images", StringComparison.Ordinal)
                ),
                It.IsAny<CancellationToken>()
            ), Times.Once);
        }

        [Fact(DisplayName = "Normal - UTCID02 - Create with OrthodonticTreatmentPlanId")]
        public async System.Threading.Tasks.Task UTCID02_CreateWithOrthoPlan_Success()
        {
            // Arrange
            SetupHttpContext("Assistant");

            var command = new CreatePatientDentalImageCommand
            {
                PatientId = 10,
                Description = "Ortho image",
                ImageFile = CreateMockImageFile(),
                OrthodonticTreatmentPlanId = 30
            };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG113, result);

            var image = await _context.Images.FirstOrDefaultAsync(x => x.PatientId == 10);
            Assert.NotNull(image);
            Assert.Equal(30, image.OrthodonticTreatmentPlanId);
            Assert.Null(image.TreatmentRecordId);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Should handle notification failure gracefully")]
        public async System.Threading.Tasks.Task UTCID03_NotificationFailure_StillSucceeds()
        {
            // Arrange
            SetupHttpContext("Assistant");

            _mockMediator
                .Setup(x => x.Send(It.IsAny<SendNotificationCommand>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new Exception("Notification failed"));

            var command = new CreatePatientDentalImageCommand
            {
                PatientId = 10,
                Description = "Test image",
                ImageFile = CreateMockImageFile(),
                TreatmentRecordId = 20
            };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG113, result);
            Assert.NotNull(await _context.Images.FirstOrDefaultAsync(x => x.PatientId == 10));
        }

        // ... các test case khác giữ nguyên ...

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }
    }
}
