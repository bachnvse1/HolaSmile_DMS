using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistants.CreatePatientDentalImage;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants
{
    public class CreatePatientDentalImageHandlerTests
    {
        private readonly Mock<IPatientRepository> _patientRepoMock = new();
        private readonly Mock<IImageRepository> _imageRepoMock = new();
        private readonly Mock<ICloudinaryService> _cloudServiceMock = new();
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly Mock<ITreatmentRecordRepository> _treatmentRecordRepoMock = new();
        private readonly Mock<IOrthodonticTreatmentPlanRepository> _orthoPlanRepoMock = new();
        private readonly Mock<IMediator> _mediatorMock = new();
        private readonly CreatePatientDentalImageHandler _handler;

        public CreatePatientDentalImageHandlerTests()
        {
            _handler = new CreatePatientDentalImageHandler(
                _patientRepoMock.Object,
                _imageRepoMock.Object,
                _cloudServiceMock.Object,
                _httpContextAccessorMock.Object,
                _treatmentRecordRepoMock.Object,
                _orthoPlanRepoMock.Object,
                _mediatorMock.Object
            );

            // Default setup cho mediator
            _mediatorMock
                .Setup(x => x.Send(It.IsAny<SendNotificationCommand>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MediatR.Unit.Value);
        }

        private void SetupHttpContext(string role, string userId = "1", string fullName = "Test User")
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.GivenName, fullName)
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = principal };

            _httpContextAccessorMock.Setup(h => h.HttpContext).Returns(context);
        }

        private IFormFile CreateFakeImage(string contentType = "image/jpeg")
        {
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.ContentType).Returns(contentType);
            fileMock.Setup(f => f.FileName).Returns("test.jpg");
            return fileMock.Object;
        }

        [Fact(DisplayName = "UTCID01 - Assistant tạo ảnh thành công")]
        public async System.Threading.Tasks.Task UTCID01_Assistant_Create_Image_Success()
        {
            // Arrange
            SetupHttpContext("Assistant", "1", "Test Assistant");
            var patient = new Patient
            {
                PatientID = 1,
                UserID = 100,
                User = new User { UserID = 100, Fullname = "Test Patient" }
            };
            var treatmentRecord = new TreatmentRecord
            {
                TreatmentRecordID = 100
            };

            var command = new CreatePatientDentalImageCommand
            {
                PatientId = 1,
                ImageFile = CreateFakeImage("image/jpeg"),
                Description = "Test image",
                TreatmentRecordId = 100
            };

            _patientRepoMock.Setup(x => x.GetPatientByPatientIdAsync(1))
                .ReturnsAsync(patient);

            _treatmentRecordRepoMock.Setup(x => x.GetTreatmentRecordByIdAsync(100, default))
                .ReturnsAsync(treatmentRecord);

            _cloudServiceMock.Setup(x => x.UploadImageAsync(It.IsAny<IFormFile>(), "dental-images"))
                .ReturnsAsync("http://image.url");

            _imageRepoMock.Setup(x => x.CreateAsync(It.IsAny<Image>()))
                .ReturnsAsync(true);

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG113, result);

            _imageRepoMock.Verify(x => x.CreateAsync(It.Is<Image>(img =>
                img.PatientId == 1 &&
                img.TreatmentRecordId == 100 &&
                img.ImageURL == "http://image.url" &&
                img.Description == "Test image" &&
                !img.IsDeleted
            )), Times.Once);

            _mediatorMock.Verify(m => m.Send(
                    It.Is<SendNotificationCommand>(n =>
                        n.UserId == 100 &&
                        n.Title == "Tạo ảnh nha khoa" &&
                        n.Message == "Một ảnh nha khoa mới đã được thêm vào hồ sơ của bạn bởi Test Assistant." &&
                        n.Type == "Create" &&
                        n.MappingUrl.Contains($"patient/treatment-records/{treatmentRecord.TreatmentRecordID}/images")
                    ),
                    It.IsAny<CancellationToken>()
                ), Times.Once);
        }

        [Fact(DisplayName = "UTCID02 - Role không hợp lệ")]
        public async System.Threading.Tasks.Task UTCID02_Invalid_Role_Throws()
        {
            // Arrange
            SetupHttpContext("Receptionist");

            var command = new CreatePatientDentalImageCommand
            {
                PatientId = 1,
                ImageFile = CreateFakeImage(),
                TreatmentRecordId = 100
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
            _imageRepoMock.Verify(x => x.CreateAsync(It.IsAny<Image>()), Times.Never);
        }

        [Fact(DisplayName = "UTCID03 - Định dạng ảnh không hợp lệ")]
        public async System.Threading.Tasks.Task UTCID03_Invalid_Image_Format_Throws()
        {
            // Arrange
            SetupHttpContext("Assistant");
            var patient = new Patient { PatientID = 1 };

            var command = new CreatePatientDentalImageCommand
            {
                PatientId = 1,
                ImageFile = CreateFakeImage("application/pdf"),
                TreatmentRecordId = 100
            };

            _patientRepoMock.Setup(x => x.GetPatientByPatientIdAsync(1))
                .ReturnsAsync(patient);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
                _handler.Handle(command, default));

            Assert.Contains("định dạng", ex.Message);
            _cloudServiceMock.Verify(x => x.UploadImageAsync(It.IsAny<IFormFile>(), It.IsAny<string>()), Times.Never);
            _imageRepoMock.Verify(x => x.CreateAsync(It.IsAny<Image>()), Times.Never);
        }

        [Fact(DisplayName = "UTCID04 - Cả hai loại hồ sơ được chọn")]
        public async System.Threading.Tasks.Task UTCID04_Both_Records_Selected_Throws()
        {
            // Arrange
            SetupHttpContext("Assistant");
            var patient = new Patient { PatientID = 1 };

            var command = new CreatePatientDentalImageCommand
            {
                PatientId = 1,
                ImageFile = CreateFakeImage(),
                TreatmentRecordId = 100,
                OrthodonticTreatmentPlanId = 200
            };

            _patientRepoMock.Setup(x => x.GetPatientByPatientIdAsync(1))
                .ReturnsAsync(patient);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
                _handler.Handle(command, default));

            Assert.Contains("Chỉ được chọn một", ex.Message);
            _cloudServiceMock.Verify(x => x.UploadImageAsync(It.IsAny<IFormFile>(), It.IsAny<string>()), Times.Never);
            _imageRepoMock.Verify(x => x.CreateAsync(It.IsAny<Image>()), Times.Never);
        }

        [Fact(DisplayName = "UTCID05 - Hồ sơ không tồn tại")]
        public async System.Threading.Tasks.Task UTCID05_Record_Not_Found_Throws()
        {
            // Arrange
            SetupHttpContext("Assistant");
            var patient = new Patient { PatientID = 1 };

            var command = new CreatePatientDentalImageCommand
            {
                PatientId = 1,
                ImageFile = CreateFakeImage(),
                TreatmentRecordId = 999
            };

            _patientRepoMock.Setup(x => x.GetPatientByPatientIdAsync(1))
                .ReturnsAsync(patient);

            _treatmentRecordRepoMock.Setup(x => x.GetTreatmentRecordByIdAsync(999, default))
                .ReturnsAsync((TreatmentRecord?)null);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Contains("Hồ sơ điều trị không tồn tại", ex.Message);
            _cloudServiceMock.Verify(x => x.UploadImageAsync(It.IsAny<IFormFile>(), It.IsAny<string>()), Times.Never);
            _imageRepoMock.Verify(x => x.CreateAsync(It.IsAny<Image>()), Times.Never);
        }
    }
}