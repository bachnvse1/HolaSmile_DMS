using System.Globalization;
using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using OfficeOpenXml;

namespace Application.Usecases.Assistant.CreateSupply
{
    public class ImportSupplyFromExcelHandler : IRequestHandler<ImportSupplyFromExcelCommand, int>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ISupplyRepository _supplyRepository;

        private const string AssistantRole = "assistant";

        public ImportSupplyFromExcelHandler(IHttpContextAccessor httpContextAccessor, ISupplyRepository supplyRepository)
        {
            _httpContextAccessor = httpContextAccessor;
            _supplyRepository = supplyRepository;
        }

        public async Task<int> Handle(ImportSupplyFromExcelCommand request, CancellationToken cancellationToken)
        {
            // 1. Check file
            if (request.File == null || request.File.Length == 0)
            {
                throw new ArgumentException("File import không hợp lệ.");
            }

            // 2. Check current user & role
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;

            if (currentUserId == 0 || !string.Equals(currentUserRole, AssistantRole, StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // Bạn không có quyền truy cập chức năng này
            }

            // 3. Đọc Excel
            using var stream = request.File.OpenReadStream();
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
            using var package = new ExcelPackage(stream);
            var worksheet = package.Workbook.Worksheets[0];

            int rowCount = worksheet.Dimension.Rows;
            int successCount = 0;

            for (int row = 2; row <= rowCount; row++)
            {
                // Đọc từng giá trị, bỏ qua dòng lỗi
                var name = worksheet.Cells[row, 1].GetValue<string>()?.Trim();
                var unit = worksheet.Cells[row, 2].GetValue<string>()?.Trim();
                var quantity = worksheet.Cells[row, 3].GetValue<int>();
                var price = worksheet.Cells[row, 4].GetValue<decimal>();
                var expiryString = worksheet.Cells[row, 5].GetValue<string>()?.Trim();

                if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(unit)) continue;

                DateTime? expiryDate = null;
                if (!string.IsNullOrWhiteSpace(expiryString) &&
                    DateTime.TryParseExact(
                        expiryString,
                        new[] { "dd/MM/yyyy", "d/M/yyyy", "dd-MM-yyyy", "yyyy-MM-dd" },
                        CultureInfo.InvariantCulture,
                        DateTimeStyles.None,
                        out var parsedDate))
                {
                    expiryDate = parsedDate;
                }

                var supply = new Supplies
                {
                    Name = name,
                    Unit = unit,
                    QuantityInStock = quantity,
                    Price = price,
                    ExpiryDate = expiryDate,
                    CreatedAt = DateTime.Now,
                    CreatedBy = currentUserId
                };

                try
                {
                    await _supplyRepository.CreateSupplyAsync(supply);
                    successCount++;
                }
                catch (Exception ex)
                {
                    // TODO: Ghi log nếu cần
                    // _logger.LogError(ex, $"Lỗi import dòng {row}: {ex.Message}");
                    continue;
                }
            }

            return successCount;
        }
    }
}
