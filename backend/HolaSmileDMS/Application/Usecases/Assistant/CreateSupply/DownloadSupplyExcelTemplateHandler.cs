using MediatR;
using NuGet.Packaging;
using OfficeOpenXml;
using OfficeOpenXml.Style;

namespace Application.Usecases.Assistant.CreateSupply
{

    public class DownloadSupplyExcelTemplateHandler : IRequestHandler<DownloadSupplyExcelTemplateCommand, byte[]>
    {
        public Task<byte[]> Handle(DownloadSupplyExcelTemplateCommand request, CancellationToken cancellationToken)
        {
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
            using var package = new ExcelPackage();
            var worksheet = package.Workbook.Worksheets.Add("Supplies");

            worksheet.Cells[1, 1].Value = "SupplyName";
            worksheet.Cells[1, 2].Value = "Unit";
            worksheet.Cells[1, 3].Value = "QuantityInStock";
            worksheet.Cells[1, 4].Value = "Price";
            worksheet.Cells[1, 5].Value = "ExpiryDate (dd/MM/yyyy)";

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
