using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Receptionist.ViewFinancialTransactions;
using Domain.Entities;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Moq;
using OfficeOpenXml;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Receptionists.ViewFinancialTransactions
{
    public class ExportTransactionToExcelHandlerTests
    {
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly Mock<ITransactionRepository> _transactionRepoMock = new();
        private readonly ExportTransactionToExcelHandler _handler;

        public ExportTransactionToExcelHandlerTests()
        {
            _handler = new ExportTransactionToExcelHandler(
                _httpContextAccessorMock.Object,
                _transactionRepoMock.Object
            );
        }
        private void SetupHttpContext(string role = "receptionist", string userId = "1")
        {
            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Role, role),
        }, "mock"));

            _httpContextAccessorMock.Setup(x => x.HttpContext!.User).Returns(user);
        }

        [Fact(DisplayName = "UTCID01 - Throw when user is not receptionist or owner")]
        public async System.Threading.Tasks.Task UTCID01_Throw_WhenInvalidRole()
        {
            SetupHttpContext("assistant");

            var command = new ExportTransactionToExcelCommand();

            var act = async () => await _handler.Handle(command, CancellationToken.None);

            await act.Should().ThrowAsync<UnauthorizedAccessException>()
                .WithMessage(MessageConstants.MSG.MSG26);
        }

        [Fact(DisplayName = "UTCID02 - Return Excel file with data when valid")]
        public async System.Threading.Tasks.Task UTCID02_ReturnExcel_WhenValid()
        {
            SetupHttpContext("receptionist");

            // Arrange mock data
            var transactions = new List<FinancialTransaction>
        {
            new FinancialTransaction
            {
                TransactionID = 1,
                TransactionType = true,
                Category = "Thu tiền",
                Description = "Khách thanh toán",
                Amount = 100000,
                PaymentMethod = true,
                TransactionDate = new DateTime(2025, 7, 25)
            },
            new FinancialTransaction
            {
                TransactionID = 2,
                TransactionType = false,
                Category = "Chi phí",
                Description = "Mua vật tư",
                Amount = 50000,
                PaymentMethod = false,
                TransactionDate = new DateTime(2025, 7, 24)
            }
        };

            _transactionRepoMock.Setup(r => r.GetAllFinancialTransactionsAsync())
                .ReturnsAsync(transactions);

            // Act
            var result = await _handler.Handle(new ExportTransactionToExcelCommand(), CancellationToken.None);

            // Assert Excel content
            result.Should().NotBeNull();
            result.Length.Should().BeGreaterThan(0);

            using var package = new ExcelPackage(new MemoryStream(result));
            var worksheet = package.Workbook.Worksheets["Danh sách thu chi"];
            worksheet.Should().NotBeNull();

            // Kiểm tra header
            worksheet.Cells[1, 1].Text.Should().Be("Loại phiếu");
            worksheet.Cells[1, 2].Text.Should().Be("Tiêu đề");

            // Kiểm tra dữ liệu dòng 2
            worksheet.Cells[2, 1].Text.Should().Be("thu");
            worksheet.Cells[2, 2].Text.Should().Be("Thu tiền");
            worksheet.Cells[2, 3].Text.Should().Be("Khách thanh toán");
            worksheet.Cells[2, 4].Text.Should().Be("100000");

            // Kiểm tra dữ liệu dòng 3
            worksheet.Cells[3, 1].Text.Should().Be("chi");
            worksheet.Cells[3, 2].Text.Should().Be("Chi phí");
            worksheet.Cells[3, 3].Text.Should().Be("Mua vật tư");
            worksheet.Cells[3, 4].Text.Should().Be("50000");
        }
    }

}
