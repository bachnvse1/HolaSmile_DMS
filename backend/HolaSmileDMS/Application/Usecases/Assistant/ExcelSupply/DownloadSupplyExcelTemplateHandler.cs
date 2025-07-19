using Application.Constants;
using System.Security.Claims;
using MediatR;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using Microsoft.AspNetCore.Http;
using Application.Interfaces;

namespace Application.Usecases.Assistant.ExcelSupply
{

    public class DownloadSupplyExcelTemplateHandler : IRequestHandler<DownloadSupplyExcelTemplateCommand, byte[]>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public DownloadSupplyExcelTemplateHandler(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }
        public Task<byte[]> Handle(DownloadSupplyExcelTemplateCommand request, CancellationToken cancellationToken)
        {

            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;

            if (currentUserId == 0 || !string.Equals(currentUserRole, "Assistant", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // Bạn không có quyền truy cập chức năng này
            }

            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
            using var package = new ExcelPackage();
            var worksheet = package.Workbook.Worksheets.Add("Quản lý Vật tư");

            worksheet.Cells[1, 1].Value = "Tên Vật tư";
            worksheet.Cells[1, 2].Value = "Đơn Vị (Cái)";
            worksheet.Cells[1, 3].Value = "Số lượng trong kho";
            worksheet.Cells[1, 4].Value = "Giá Vật Tư";
            worksheet.Cells[1, 5].Value = "Hạn Vật Tư";

            using (var range = worksheet.Cells[1, 1, 1, 5])
            {
                range.Style.Font.Bold = true;
                range.Style.Fill.PatternType = ExcelFillStyle.Solid;
                range.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightGray);
            }

            worksheet.Cells.AutoFitColumns();
            using (var stream = new MemoryStream())
            {
                package.SaveAs(stream);
                return System.Threading.Tasks.Task.FromResult(stream.ToArray());
            }
        }
    }
}
