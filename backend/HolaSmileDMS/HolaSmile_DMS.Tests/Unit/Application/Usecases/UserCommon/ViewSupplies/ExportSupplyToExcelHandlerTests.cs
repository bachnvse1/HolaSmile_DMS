using System.Security.Claims;
using Application.Interfaces;
using Application.Usecases.Assistants.ExcelSupply;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Moq;
using OfficeOpenXml;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.UserCommon.ViewSupplies
{
    public class ExportSupplyToExcelHandlerTests
    {
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly Mock<ISupplyRepository> _supplyRepoMock = new();
        private readonly ExportSupplyToExcelHandler _handler;

        public ExportSupplyToExcelHandlerTests()
        {
            _handler = new ExportSupplyToExcelHandler(
                _httpContextAccessorMock.Object,
                _supplyRepoMock.Object
            );
        }

        // Helper: Setup HttpContext
        private void SetupHttpContext(string role = "assistant", string userId = "1")
        {
            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Role, role)
            }, "mock"));

            _httpContextAccessorMock.Setup(x => x.HttpContext!.User).Returns(user);
        }

        [Fact(DisplayName = "UTCID01 - Throw when role is administrator or patient")]
        public async System.Threading.Tasks.Task UTCID01_ShouldThrow_WhenInvalidRole()
        {
            // Arrange
            SetupHttpContext("administrator");
            var command = new ExportSupplyToExcelCommand();

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, CancellationToken.None));
        }

        [Fact(DisplayName = "UTCID02 - Return Excel file with correct header and data")]
        public async System.Threading.Tasks.Task UTCID02_ShouldReturnExcelFile_WhenValidRole()
        {
            // Arrange
            SetupHttpContext("assistant");

            var supplies = new List<Supplies>
            {
                new Supplies
                {
                    Name = "Găng tay y tế",
                    Unit = "Cái",
                    QuantityInStock = 100,
                    Price = 2000,
                    ExpiryDate = new DateTime(2025, 12, 31)
                }
            };

            _supplyRepoMock.Setup(r => r.GetAllSuppliesAsync())
                .ReturnsAsync(supplies);

            var command = new ExportSupplyToExcelCommand();

            // Act
            var resultBytes = await _handler.Handle(command, CancellationToken.None);

            // Assert: result is not null and can open as Excel
            resultBytes.Should().NotBeNull();
            using var package = new ExcelPackage(new MemoryStream(resultBytes));
            var worksheet = package.Workbook.Worksheets["Quản lý Vật tư"];

            worksheet.Should().NotBeNull();
            worksheet.Cells[1, 1].Text.Should().Be("Tên Vật tư");
            worksheet.Cells[2, 1].Text.Should().Be("Găng tay y tế");
            worksheet.Cells[2, 3].Text.Should().Be("100");
        }

        [Fact(DisplayName = "UTCID03 - Return empty Excel file when no supplies found")]
        public async System.Threading.Tasks.Task UTCID03_ShouldReturnEmptyExcel_WhenNoData()
        {
            // Arrange
            SetupHttpContext("assistant");

            _supplyRepoMock.Setup(r => r.GetAllSuppliesAsync())
                .ReturnsAsync(new List<Supplies>());

            var command = new ExportSupplyToExcelCommand();

            // Act
            var resultBytes = await _handler.Handle(command, CancellationToken.None);

            // Assert: file vẫn có header nhưng không có data
            resultBytes.Should().NotBeNull();
            using var package = new ExcelPackage(new MemoryStream(resultBytes));
            var worksheet = package.Workbook.Worksheets["Quản lý Vật tư"];

            worksheet.Cells[1, 1].Text.Should().Be("Tên Vật tư");
            worksheet.Cells[2, 1].Text.Should().Be(string.Empty); // không có data
        }
    }
}
