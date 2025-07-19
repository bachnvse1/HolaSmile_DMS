using System.Globalization;
using Application.Constants;
using System.Security.Claims;
using Application.Interfaces;
using MediatR;
using OfficeOpenXml;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Assistant.ExcelSupply
{
    public class ExportSupplyToExcelHandler : IRequestHandler<ExportSupplyToExcelCommand, byte[]>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ISupplyRepository _supplyRepository;

        public ExportSupplyToExcelHandler(IHttpContextAccessor httpContextAccessor, ISupplyRepository supplyRepository)
        {
            _httpContextAccessor = httpContextAccessor;
            _supplyRepository = supplyRepository;
        }

        public async Task<byte[]> Handle(ExportSupplyToExcelCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;

            if (currentUserId == 0 || !string.Equals(currentUserRole, "assistant", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // Bạn không có quyền truy cập chức năng này
            }

            // Load data
            var supplies = await _supplyRepository.GetAllSuppliesAsync(); // giả sử có hàm này

            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

            using var package = new ExcelPackage();
            var worksheet = package.Workbook.Worksheets.Add("Quản lý Vật tư");

            // Header
            worksheet.Cells[1, 1].Value = "Tên Vật tư";
            worksheet.Cells[1, 2].Value = "Đơn Vị (Cái)";
            worksheet.Cells[1, 3].Value = "Số lượng trong kho";
            worksheet.Cells[1, 4].Value = "Giá Vật Tư";
            worksheet.Cells[1, 5].Value = "Hạn Vật Tư";

            int row = 2;
            foreach (var s in supplies)
            {
                worksheet.Cells[row, 1].Value = s.Name;
                worksheet.Cells[row, 2].Value = s.Unit;
                worksheet.Cells[row, 3].Value = s.QuantityInStock;
                worksheet.Cells[row, 4].Value = s.Price;
                worksheet.Cells[row, 5].Value = s.ExpiryDate?.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture);
                row++;
            }

            worksheet.Cells.AutoFitColumns();
            return package.GetAsByteArray();
        }
    }
}
