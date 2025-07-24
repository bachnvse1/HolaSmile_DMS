using System.Globalization;
using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Http;
using OfficeOpenXml;

namespace Application.Usecases.Assistants.ExcelSupply
{
    public class ImportSupplyFromExcelHandler : IRequestHandler<ImportSupplyFromExcelCommand, int>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ISupplyRepository _supplyRepository;
        private readonly ITransactionRepository _transactionRepository;

        public ImportSupplyFromExcelHandler(
            IHttpContextAccessor httpContextAccessor,
            ISupplyRepository supplyRepository,
            ITransactionRepository transactionRepository)
        {
            _httpContextAccessor = httpContextAccessor;
            _supplyRepository = supplyRepository;
            _transactionRepository = transactionRepository;
        }

        public async Task<int> Handle(ImportSupplyFromExcelCommand request, CancellationToken cancellationToken)
        {
            if (request.File == null || request.File.Length == 0)
                throw new ArgumentException("File import không hợp lệ.");

            var user = _httpContextAccessor.HttpContext?.User;

            var currentUserId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var currentUserRole = user.FindFirstValue(ClaimTypes.Role);

            if (!string.Equals(currentUserRole, "assistant", StringComparison.OrdinalIgnoreCase))
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
            using var stream = request.File.OpenReadStream();
            using var package = new ExcelPackage(stream);
            var worksheet = package.Workbook.Worksheets[0];
            var rowCount = worksheet.Dimension.Rows;
            var successCount = 0;
            var now = DateTime.Now;

            for (int row = 2; row <= rowCount; row++)
            {
                var name = worksheet.Cells[row, 1].GetValue<string>()?.Trim();
                var unit = worksheet.Cells[row, 2].GetValue<string>()?.Trim();
                var quantity = worksheet.Cells[row, 3].GetValue<int>();
                var price = worksheet.Cells[row, 4].GetValue<decimal>();
                var expiryRaw = worksheet.Cells[row, 5].GetValue<string>()?.Trim();

                if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(unit)) continue;

                DateTime? expiryDate = TryParseExpiryDate(expiryRaw);

                try
                {
                    // Tạo transaction
                    var transaction = new FinancialTransaction
                    {
                        TransactionDate = now,
                        Description = $"Nhập kho vật tư: {name}",
                        TransactionType = false, // Nhập kho
                        Category = "Vật tư y tế",
                        PaymentMethod = true, // tiền mặt
                        Amount = price * quantity,
                        CreatedAt = now,
                        CreatedBy = currentUserId,
                        IsDelete = false
                    };

                    var isTransactionCreated = await _transactionRepository.CreateTransactionAsync(transaction);
                    if (!isTransactionCreated) continue;

                    // Tạo supply
                    var supply = new Supplies
                    {
                        Name = name,
                        Unit = unit,
                        QuantityInStock = quantity,
                        Price = Math.Round(price, 2),
                        ExpiryDate = expiryDate,
                        CreatedAt = now,
                        CreatedBy = currentUserId,
                        IsDeleted = false
                    };

                    var isSupplyCreated = await _supplyRepository.CreateSupplyAsync(supply);
                    if (!isSupplyCreated) continue;

                    successCount++;
                }
                catch
                {
                    // TODO: Ghi log nếu cần
                    continue;
                }
            }

            return successCount;
        }

        private static DateTime? TryParseExpiryDate(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return null;

            string[] formats = { "dd/MM/yyyy", "d/M/yyyy", "dd-MM-yyyy", "yyyy-MM-dd" };
            if (DateTime.TryParseExact(raw, formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
                return parsed;

            return null;
        }
    }
}
