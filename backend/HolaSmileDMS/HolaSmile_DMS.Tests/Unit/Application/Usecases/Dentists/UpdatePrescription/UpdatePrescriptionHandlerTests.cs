using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentists.EditPrescription;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Dentists
{
    public class EditPrescriptionHandlerTests
    {
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly Mock<IPrescriptionRepository> _prescriptionRepoMock;
        private readonly EditPrescriptionHandler _handler;

        public EditPrescriptionHandlerTests()
        {
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _prescriptionRepoMock = new Mock<IPrescriptionRepository>();
            _handler = new EditPrescriptionHandler(_httpContextAccessorMock.Object, _prescriptionRepoMock.Object);
        }

        private void SetupHttpContext(string role, string userId)
        {
            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Role, role)
        }, "mock"));

            var context = new DefaultHttpContext { User = user };
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);
        }

        [Fact(DisplayName = "UTCID01 - Return Unauthorized if not logged in")]
        public async System.Threading.Tasks.Task UTCID01_UnauthorizedIfNotLoggedIn()
        {
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns((HttpContext)null);
            var command = new EditPrescriptionCommand { PrescriptionId = 1, contents = "test" };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
        }

        [Fact(DisplayName = "UTCID02 - Return Unauthorized if role is not Dentist")]
        public async System.Threading.Tasks.Task UTCID02_UnauthorizedIfNotDentist()
        {
            SetupHttpContext("receptionist", "1");
            var command = new EditPrescriptionCommand { PrescriptionId = 1, contents = "test" };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID03 - Throw exception if prescription not found")]
        public async System.Threading.Tasks.Task UTCID03_ThrowIfPrescriptionNotFound()
        {
            SetupHttpContext("dentist", "1");
            _prescriptionRepoMock.Setup(x => x.GetPrescriptionByPrescriptionIdAsync(999)).ReturnsAsync((Prescription)null);

            var command = new EditPrescriptionCommand { PrescriptionId = 999, contents = "abc" };

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
        }

        [Fact(DisplayName = "UTCID04 - Throw if content is empty or whitespace")]
        public async System.Threading.Tasks.Task UTCID04_ThrowIfEmptyContent()
        {
            SetupHttpContext("dentist", "1");
            var prescription = new Prescription { PrescriptionId = 1, Content = "old" };
            _prescriptionRepoMock.Setup(x => x.GetPrescriptionByPrescriptionIdAsync(1)).ReturnsAsync(prescription);

            var command = new EditPrescriptionCommand { PrescriptionId = 1, contents = "  " };

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
        }

        [Fact(DisplayName = "UTCID05 - Update prescription content successfully")]
        public async System.Threading.Tasks.Task UTCID05_UpdateSuccess()
        {
            SetupHttpContext("dentist", "2");
            var prescription = new Prescription { PrescriptionId = 10, Content = "old" };
            _prescriptionRepoMock.Setup(x => x.GetPrescriptionByPrescriptionIdAsync(10)).ReturnsAsync(prescription);
            _prescriptionRepoMock.Setup(x => x.UpdatePrescriptionAsync(It.IsAny<Prescription>())).ReturnsAsync(true);

            var command = new EditPrescriptionCommand
            {
                PrescriptionId = 10,
                contents = "new content"
            };

            var result = await _handler.Handle(command, CancellationToken.None);

            Assert.True(result);
            Assert.Equal("new content", prescription.Content);
            Assert.Equal(2, prescription.UpdatedBy);
            Assert.NotNull(prescription.UpdatedAt);
        }

        [Fact(DisplayName = "UTCID06 - Update fails (repository returns false)")]
        public async System.Threading.Tasks.Task UTCID06_UpdateFailed()
        {
            SetupHttpContext("dentist", "3");
            var prescription = new Prescription { PrescriptionId = 99, Content = "cũ" };
            _prescriptionRepoMock.Setup(x => x.GetPrescriptionByPrescriptionIdAsync(99)).ReturnsAsync(prescription);
            _prescriptionRepoMock.Setup(x => x.UpdatePrescriptionAsync(It.IsAny<Prescription>())).ReturnsAsync(false);

            var command = new EditPrescriptionCommand
            {
                PrescriptionId = 99,
                contents = "cập nhật mới"
            };

            var result = await _handler.Handle(command, CancellationToken.None);
            Assert.False(result);
        }
    }

}
