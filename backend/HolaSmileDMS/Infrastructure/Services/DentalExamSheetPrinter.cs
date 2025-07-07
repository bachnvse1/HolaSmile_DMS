using System.Text;
using Application.Services;
using Application.Usecases.Patients.ViewDentalRecord;

namespace Infrastructure.Services;

public class DentalExamSheetPrinter : IDentalExamSheetPrinter
{
    public string RenderDentalExamSheetToHtml(DentalExamSheetDto sheet)
{
    var sb = new StringBuilder();
    sb.AppendLine("<html><head><meta charset='UTF-8'><style>");
    sb.AppendLine("body { font-family: 'Segoe UI', sans-serif; font-size: 14px; color: #333; margin: 40px; }");
    sb.AppendLine("h2 { text-align: center; color: #2c3e50; }");
    sb.AppendLine("table { border-collapse: collapse; width: 100%; margin-bottom: 30px; }");
    sb.AppendLine("th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }");
    sb.AppendLine("th { background-color: #f8f8f8; font-weight: 600; }");
    sb.AppendLine("section { margin-top: 30px; }");
    sb.AppendLine("hr { border: none; border-top: 2px solid #eee; margin: 30px 0; }");
    sb.AppendLine("ul { padding-left: 20px; }");
    sb.AppendLine("</style></head><body>");

    sb.AppendLine("<h2>PHIẾU KHÁM RĂNG</h2>");
    sb.AppendLine("<section>");
    sb.AppendLine($"<p><strong>Tên bệnh nhân:</strong> {sheet.PatientName}</p>");
    sb.AppendLine($"<p><strong>Ngày sinh:</strong> {sheet.BirthYear:dd/MM/yyyy}</p>");
    sb.AppendLine($"<p><strong>Điện thoại:</strong> {sheet.Phone}</p>");
    sb.AppendLine($"<p><strong>Địa chỉ:</strong> {sheet.Address}</p>");
    sb.AppendLine($"<p><strong>Ngày in:</strong> {sheet.PrintedAt:dd/MM/yyyy HH:mm}</p>");
    sb.AppendLine("</section>");

    sb.AppendLine("<hr /><section>");
    sb.AppendLine("<h3>1. Chi tiết điều trị</h3>");
    sb.AppendLine("<table>");
    sb.AppendLine("<tr><th>Ngày</th><th>Thủ thuật</th><th>Triệu chứng</th><th>Chẩn đoán</th><th>Nha sĩ</th><th>Số lượng</th><th>Đơn giá</th><th>Giảm</th><th>Tổng</th><th>Bảo hành</th></tr>");
    foreach (var t in sheet.Treatments)
    {
        sb.AppendLine($"<tr><td>{t.TreatmentDate:dd/MM/yyyy}</td><td>{t.ProcedureName}</td><td>{t.Symptoms}</td><td>{t.Diagnosis}</td><td>{t.DentistName}</td><td>{t.Quantity}</td><td>{t.UnitPrice:N0}₫</td><td>{t.Discount:N0}₫</td><td>{t.TotalAmount:N0}₫</td><td>{t.WarrantyTerm ?? 0}</td></tr>");
    }
    sb.AppendLine("</table></section>");

    sb.AppendLine("<hr /><section>");
    sb.AppendLine("<h3>2. Đơn thuốc</h3><ul>");
    foreach (var p in sheet.PrescriptionItems)
        sb.AppendLine($"<li>{p}</li>");
    sb.AppendLine("</ul></section>");

    sb.AppendLine("<hr /><section>");
    sb.AppendLine("<h3>3. Hướng dẫn</h3><ul>");
    foreach (var i in sheet.Instructions)
        sb.AppendLine($"<li>{i}</li>");
    sb.AppendLine("</ul></section>");

    sb.AppendLine("<hr /><section>");
    sb.AppendLine("<h3>4. Lịch sử thanh toán</h3>");
    sb.AppendLine("<table>");
    sb.AppendLine("<tr><th>Ngày</th><th>Số tiền</th><th>Ghi chú</th></tr>");
    foreach (var pay in sheet.Payments)
    {
        sb.AppendLine($"<tr><td>{pay.Date:dd/MM/yyyy}</td><td>{pay.Amount:N0}₫</td><td>{pay.Note}</td></tr>");
    }
    sb.AppendLine("</table></section>");

    if (!string.IsNullOrWhiteSpace(sheet.NextAppointmentTime))
    {
        sb.AppendLine("<hr /><section>");
        sb.AppendLine("<h3>5. Lịch hẹn tiếp theo</h3>");
        sb.AppendLine($"<p><strong>Thời gian:</strong> {sheet.NextAppointmentTime}</p>");
        sb.AppendLine($"<p><strong>Ghi chú:</strong> {sheet.NextAppointmentNote}</p>");
        sb.AppendLine("</section>");
    }

    sb.AppendLine("</body></html>");
    return sb.ToString();
}
}
