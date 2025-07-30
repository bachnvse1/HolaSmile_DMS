using Application.Constants;
using Application.Interfaces;
using System.Globalization;
using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using OfficeOpenXml;

namespace Application.Usecases.Receptionist.ViewFinancialTransactions
{
    public class ExportTransactionToExcelHandler : IRequestHandler<ExportTransactionToExcelCommand, byte[]>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ITransactionRepository _transactionRepository;

        public ExportTransactionToExcelHandler(IHttpContextAccessor httpContextAccessor, ITransactionRepository transactionRepository)
        {
            _httpContextAccessor = httpContextAccessor;
            _transactionRepository = transactionRepository;
        }

        public async Task<byte[]> Handle(ExportTransactionToExcelCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;

            if (!string.Equals(currentUserRole, "receptionist", StringComparison.OrdinalIgnoreCase) && !string.Equals(currentUserRole, "owner", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"
            }

            // Load data
            var transactions = await _transactionRepository.GetAllFinancialTransactionsAsync();

            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

            using var package = new ExcelPackage();
            var worksheet = package.Workbook.Worksheets.Add("Danh sách thu chi");

            // Header
            worksheet.Cells[1, 1].Value = "Loại phiếu";
            worksheet.Cells[1, 2].Value = "Tiêu đề";
            worksheet.Cells[1, 3].Value = "Số tiền";
            worksheet.Cells[1, 4].Value = "Mô tả chi tiết";                                                                                                                 
            worksheet.Cells[1, 5].Value = "Phương thức giao dịch";
            worksheet.Cells[1, 6].Value = "Ngày giao dịch";

            int row = 2;
            foreach (var s in transactions)
            {
                worksheet.Cells[row, 1].Value = s.TransactionType ? "thu" : "chi";
                worksheet.Cells[row, 2].Value = s.Category;
                worksheet.Cells[row, 3].Value = s.Description;
                worksheet.Cells[row, 4].Value = s.Amount;
                worksheet.Cells[row, 5].Value = s.PaymentMethod ? "chuyển khoản" : "tiền mặt";
                worksheet.Cells[row, 6].Value = s.TransactionDate?.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture);
                row++;
            }

            worksheet.Cells.AutoFitColumns();
            return package.GetAsByteArray();
        }
    }
}
