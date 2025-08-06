using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistants.DeactivePatientDentalImage;
using Application.Usecases.SendNotification;
using HDMS_API.Infrastructure.Persistence;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants
{
    public class DeactivePatientDentalImageIntegrationTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly Mock<IMediator> _mediatorMock;
        private readonly DeactivePatientDentalImageHandler _handler;

        public DeactivePatientDentalImageIntegrationTests()
        {
            var services = new ServiceCollection();
            services.AddDbContext<ApplicationDbContext>(opt =>
                opt.UseInMemoryDatabase($"DeactiveImageDb_{Guid.NewGuid()}"));
            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            _mediatorMock = new Mock<IMediator>();
            _mediatorMock
                .Setup(x => x.Send(It.IsAny<SendNotificationCommand>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MediatR.Unit.Value);

            var imageRepo = new ImageRepository(_context);

            _handler = new DeactivePatientDentalImageHandler(
                imageRepo,
                _httpContextAccessor,
                _mediatorMock.Object
            );

            SeedData();
        }

        private void SetupHttpContext(string role, int userId = 1, string fullName = "Test Assistant")
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

        private async System.Threading.Tasks.Task SeedData()
        {
            await _context.Database.EnsureDeletedAsync();

            var user = new User
            {
                UserID = 200,
                Username = "patient1",  // Thêm trường bắt buộc
                Phone = "0123456789",  // Thêm trường bắt buộc
                Fullname = "Test Patient",
                Status = true,
                CreatedAt = DateTime.Now
            };
            _context.Users.Add(user);

            var patient = new Patient
            {
                PatientID = 10,
                UserID = 200,
                User = user,
                CreatedAt = DateTime.Now
            };
            _context.Patients.Add(patient);

            var treatmentRecord = new TreatmentRecord
            {
                TreatmentRecordID = 50,
                CreatedAt = DateTime.Now
            };
            _context.TreatmentRecords.Add(treatmentRecord);

            _context.Images.AddRange(
                new Image
                {
                    ImageId = 100,
                    PatientId = 10,
                    Patient = patient,
                    ImageURL = "https://test.com/image.jpg",
                    IsDeleted = false,
                    CreatedAt = DateTime.Now,
                    TreatmentRecordId = 50,
                    TreatmentRecord = treatmentRecord
                },
                new Image
                {
                    ImageId = 101,
                    PatientId = 10,
                    Patient = patient,
                    ImageURL = "https://test.com/deleted.jpg",
                    IsDeleted = true,
                    CreatedAt = DateTime.Now
                }
            );

            await _context.SaveChangesAsync();
        }

        [Fact(DisplayName = "Normal - UTCID01 - Assistant vô hiệu hóa ảnh nha khoa thành công")]
        public async System.Threading.Tasks.Task Normal_UTCID01_DeactivateImage_Success()
        {
            // Arrange
            SetupHttpContext("Assistant", 1, "Test Assistant");

            var command = new DeactivePatientDentalImageCommand { ImageId = 100 };

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.Equal("Xoá ảnh thành công.", result);

            var img = await _context.Images
                .Include(i => i.Patient)
                .ThenInclude(p => p.User)
                .FirstOrDefaultAsync(i => i.ImageId == 100);

            Assert.NotNull(img);
            Assert.True(img.IsDeleted);
            Assert.NotNull(img.UpdatedAt);
            Assert.Equal(1, img.UpdatedBy);

            // Verify notification với nội dung chính xác từ handler
            _mediatorMock.Verify(m => m.Send(
                It.Is<SendNotificationCommand>(n =>
                    n.UserId == 200 &&
                    n.Title == "Xoá ảnh nha khoa" &&
                    n.Message == "Một ảnh nha khoa trong hồ sơ của bạn vừa bị xoá." &&
                    n.Type == "Delete" &&
                    n.RelatedObjectId == 50 &&
                    string.Equals(n.MappingUrl, "/patient/treatment-records/50/images", StringComparison.Ordinal)
                ),
                It.IsAny<CancellationToken>()
            ), Times.Once);
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - Unauthorized role throws MSG26")]
        public async System.Threading.Tasks.Task UTCID02_UnauthorizedRole_Throws()
        {
            // Arrange
            SetupHttpContext("Receptionist");

            var command = new DeactivePatientDentalImageCommand { ImageId = 100 };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Non-existing image throws KeyNotFoundException")]
        public async System.Threading.Tasks.Task UTCID03_ImageNotFound_Throws()
        {
            // Arrange
            SetupHttpContext("Assistant");

            var command = new DeactivePatientDentalImageCommand { ImageId = 999 };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Contains("Không tìm thấy ảnh", ex.Message);

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Abnormal - UTCID04 - Already deleted image throws KeyNotFoundException")]
        public async System.Threading.Tasks.Task UTCID04_ImageAlreadyDeleted_Throws()
        {
            // Arrange
            SetupHttpContext("Dentist");

            var command = new DeactivePatientDentalImageCommand { ImageId = 101 };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Contains("đã bị xoá", ex.Message);

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }
    }
}