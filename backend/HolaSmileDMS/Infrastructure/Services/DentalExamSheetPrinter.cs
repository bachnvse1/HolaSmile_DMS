using System.Text;
using Application.Services;
using Application.Usecases.Patients.ViewDentalRecord;

namespace Infrastructure.Services;

public class DentalExamSheetPrinter : IDentalExamSheetPrinter
{
    public string RenderDentalExamSheetToHtml(DentalExamSheetDto sheet)
    {
        var sb = new StringBuilder();
        sb.AppendLine("<html><head><style>");
        sb.AppendLine("body { font-family: Arial; font-size: 14px; } table { border-collapse: collapse; width: 100%; }");
        sb.AppendLine("th, td { border: 1px solid #ddd; padding: 8px; } th { background-color: #f2f2f2; }");
        sb.AppendLine("</style></head><body>");

        sb.AppendLine($"<h2>Phiếu Khám Răng</h2>");
        sb.AppendLine($"<p><strong>Tên bệnh nhân:</strong> {sheet.PatientName}</p>");
        sb.AppendLine($"<p><strong>Ngày sinh:</strong> {sheet.BirthYear}</p>");
        sb.AppendLine($"<p><strong>Điện thoại:</strong> {sheet.Phone}</p>");
        sb.AppendLine($"<p><strong>Địa chỉ:</strong> {sheet.Address}</p>");
        sb.AppendLine($"<p><strong>Ngày in:</strong> {sheet.PrintedAt:dd/MM/yyyy HH:mm}</p>");

        sb.AppendLine("<h3>Chi tiết điều trị</h3><table>");
        sb.AppendLine("<tr><th>Ngày</th><th>Thủ thuật</th><th>Triệu chứng</th><th>Chẩn đoán</th><th>Nha sĩ</th><th>Số lượng</th><th>Đơn giá</th><th>Giảm</th><th>Tổng</th><th>Bảo hành</th></tr>");
        foreach (var t in sheet.Treatments)
        {
            sb.AppendLine($"<tr><td>{t.TreatmentDate:dd/MM/yyyy}</td><td>{t.ProcedureName}</td><td>{t.Symptoms}</td><td>{t.Diagnosis}</td><td>{t.DentistName}</td><td>{t.Quantity}</td><td>{t.UnitPrice:N0}</td><td>{t.Discount:N0}</td><td>{t.TotalAmount:N0}</td><td>{t.WarrantyTerm ?? "-"}</td></tr>");
        }
        sb.AppendLine("</table>");

        sb.AppendLine("<h3>Đơn thuốc</h3><ul>");
        foreach (var p in sheet.PrescriptionItems)
            sb.AppendLine($"<li>{p}</li>");
        sb.AppendLine("</ul>");

        sb.AppendLine("<h3>Hướng dẫn</h3><ul>");
        foreach (var i in sheet.Instructions)
            sb.AppendLine($"<li>{i}</li>");
        sb.AppendLine("</ul>");

        sb.AppendLine("<h3>Lịch sử thanh toán</h3><table>");
        sb.AppendLine("<tr><th>Ngày</th><th>Số tiền</th><th>Ghi chú</th></tr>");
        foreach (var pay in sheet.Payments)
        {
            sb.AppendLine($"<tr><td>{pay.Date:dd/MM/yyyy}</td><td>{pay.Amount:N0}</td><td>{pay.Note}</td></tr>");
        }
        sb.AppendLine("</table>");

        if (!string.IsNullOrWhiteSpace(sheet.NextAppointmentTime))
        {
            sb.AppendLine("<h3>Lịch hẹn tiếp theo</h3>");
            sb.AppendLine($"<p><strong>Thời gian:</strong> {sheet.NextAppointmentTime}</p>");
            sb.AppendLine($"<p><strong>Ghi chú:</strong> {sheet.NextAppointmentNote}</p>");
        }

        sb.AppendLine("</body></html>");
        return sb.ToString();
    }
}
