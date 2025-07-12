using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistants.CreatePatientDentalImage;
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
        private readonly CreatePatientDentalImageHandler _handler;

        public CreatePatientDentalImageHandlerTests()
        {
            _handler = new CreatePatientDentalImageHandler(
                _patientRepoMock.Object,
                _imageRepoMock.Object,
                _cloudServiceMock.Object,
                _httpContextAccessorMock.Object,
                _treatmentRecordRepoMock.Object,
                _orthoPlanRepoMock.Object
            );
        }

        private void SetupHttpContext(string role, string userId = "1")
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, userId)
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
            SetupHttpContext("Assistant");

            var command = new CreatePatientDentalImageCommand
            {
                PatientId = 1,
                ImageFile = CreateFakeImage("image/jpeg"),
                Description = "Test image",
                TreatmentRecordId = 100
            };

            _patientRepoMock.Setup(x => x.GetPatientByPatientIdAsync(1))
                .ReturnsAsync(new Patient());

            _treatmentRecordRepoMock.Setup(x => x.GetTreatmentRecordByIdAsync(100, default))
                .ReturnsAsync(new TreatmentRecord());

            _cloudServiceMock.Setup(x => x.UploadImageAsync(It.IsAny<IFormFile>(), It.IsAny<string>()))
                .ReturnsAsync("http://image.url");

            _imageRepoMock.Setup(x => x.CreateAsync(It.IsAny<Image>()))
                .ReturnsAsync(true);

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG113, result);
        }

        [Fact(DisplayName = "UTCID02 - Role không hợp lệ => UnauthorizedAccessException")]
        public async System.Threading.Tasks.Task UTCID02_InvalidRole_ShouldThrow()
        {
            // Arrange
            SetupHttpContext("Receptionist");

            var command = new CreatePatientDentalImageCommand
            {
                PatientId = 1,
                ImageFile = CreateFakeImage("image/jpeg"),
                Description = "Desc",
                TreatmentRecordId = 1
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID03 - Bệnh nhân không tồn tại => KeyNotFoundException")]
        public async System.Threading.Tasks.Task UTCID03_PatientNotExist_ShouldThrow()
        {
            // Arrange
            SetupHttpContext("Dentist");

            var command = new CreatePatientDentalImageCommand
            {
                PatientId = 999,
                ImageFile = CreateFakeImage("image/jpeg"),
                Description = "Desc",
                TreatmentRecordId = 1
            };

            _patientRepoMock.Setup(x => x.GetPatientByPatientIdAsync(999))
                .ReturnsAsync((Patient?)null);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG27, ex.Message);
        }

        [Fact(DisplayName = "UTCID04 - Định dạng ảnh không hợp lệ => ArgumentException")]
        public async System.Threading.Tasks.Task UTCID04_InvalidImageFormat_ShouldThrow()
        {
            // Arrange
            SetupHttpContext("Assistant");

            var command = new CreatePatientDentalImageCommand
            {
                PatientId = 1,
                ImageFile = CreateFakeImage("application/pdf"),
                Description = "Desc",
                TreatmentRecordId = 1
            };

            _patientRepoMock.Setup(x => x.GetPatientByPatientIdAsync(1))
                .ReturnsAsync(new Patient());

            // Act & Assert
            var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
                _handler.Handle(command, default));

            Assert.Contains("định dạng", ex.Message);
        }

        [Fact(DisplayName = "UTCID05 - Cả TreatmentRecordId và OrthoPlanId đều có => ArgumentException")]
        public async System.Threading.Tasks.Task UTCID05_BothSourceSelected_ShouldThrow()
        {
            // Arrange
            SetupHttpContext("Assistant");

            var command = new CreatePatientDentalImageCommand
            {
                PatientId = 1,
                ImageFile = CreateFakeImage("image/jpeg"),
                Description = "Desc",
                TreatmentRecordId = 1,
                OrthodonticTreatmentPlanId = 2
            };

            _patientRepoMock.Setup(x => x.GetPatientByPatientIdAsync(1))
                .ReturnsAsync(new Patient());

            // Act & Assert
            var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
                _handler.Handle(command, default));

            Assert.Contains("Chỉ được chọn một", ex.Message);
        }

    }
}
