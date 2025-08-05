using System.Text;
using Application.Services;
using Application.Usecases.Patients.ViewDentalRecord;
using Application.Usecases.Patients.ViewInvoices;

namespace Infrastructure.Services;

public class Printer : IPrinter
{
    public string RenderDentalExamSheetToHtml(DentalExamSheetDto sheet)
    {
        // Đọc logo và convert sang base64
        var imagePath = "wwwroot/Logo/Logo.png";
        var imageBytes = File.ReadAllBytes(imagePath);
        var base64Image = Convert.ToBase64String(imageBytes);
        var imageSrc = $"data:image/png;base64,{base64Image}";

        var sb = new StringBuilder();
        sb.AppendLine("<html><head><meta charset='UTF-8'><style>");
        sb.AppendLine("@page { size: A4 landscape; margin: 15mm; }");
        sb.AppendLine("body { font-family: 'Segoe UI', sans-serif; font-size: 12px; color: #2c3e50; margin: 0; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); }");
        sb.AppendLine(".container { background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); margin: 20px; }");
        sb.AppendLine(".header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; color: white; }");
        sb.AppendLine(".logo-section { display: flex; align-items: center; gap: 15px; }");
        sb.AppendLine(".logo-section img { height: 60px; border-radius: 8px; box-shadow: 0 4px 8px rgba(255,255,255,0.2); }");
        sb.AppendLine(".clinic-name { font-size: 20px; font-weight: bold; color: #667eea; text-shadow: 2px 2px 4px rgba(0,0,0,0.08); }");
        sb.AppendLine(".title { font-size: 28px; font-weight: bold; text-align: center; margin: 0; color: #667eea; text-shadow: 2px 2px 4px rgba(0,0,0,0.08); }");
        sb.AppendLine(".print-date { font-size: 14px; color: #667eea; opacity: 0.8; }");

        sb.AppendLine("h3 { color: #667eea; margin: 25px 0 15px 0; font-size: 18px; border-left: 4px solid #667eea; padding-left: 15px; background: linear-gradient(90deg, rgba(102,126,234,0.1) 0%, transparent 100%); padding: 10px 15px; border-radius: 5px; }");
        sb.AppendLine("table { border-collapse: collapse; width: 100%; margin-bottom: 20px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }");
        sb.AppendLine("th { background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%); color: #667eea; padding: 12px 8px; text-align: center; font-weight: 600; font-size: 12px; text-shadow: 1px 1px 2px rgba(0,0,0,0.3); }");
        sb.AppendLine("td { border: 1px solid #e1e8ed; padding: 8px; text-align: left; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; font-size: 11px; line-height: 1.4; }");
        sb.AppendLine("tr:nth-child(even) { background-color: #f8f9ff; }");
        sb.AppendLine("tr:hover { background-color: #e3f2fd; transition: background-color 0.3s; }");
        sb.AppendLine(".patient-info { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 25px; padding: 20px; background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); border-radius: 10px; border-left: 5px solid #ff9a56; }");
        sb.AppendLine(".patient-info p { margin: 8px 0; font-weight: 500; color: #5d4037; }");
        sb.AppendLine(".patient-info strong { color: #bf360c; }");
        sb.AppendLine("section { margin-bottom: 30px; }");
        sb.AppendLine("hr { border: none; height: 3px; background: linear-gradient(90deg, #667eea, #764ba2); margin: 25px 0; border-radius: 2px; }");
        sb.AppendLine("ul { padding-left: 25px; margin: 15px 0; }");
        sb.AppendLine("li { margin-bottom: 8px; padding: 5px 0; color: #37474f; line-height: 1.5; }");
        sb.AppendLine("li:before { content: '✓'; color: #4caf50; font-weight: bold; margin-right: 8px; }");
        sb.AppendLine(".treatment-table th:nth-child(1) { width: 8%; }");
        sb.AppendLine(".treatment-table th:nth-child(2) { width: 15%; }");
        sb.AppendLine(".treatment-table th:nth-child(3) { width: 18%; }");
        sb.AppendLine(".treatment-table th:nth-child(4) { width: 18%; }");
        sb.AppendLine(".treatment-table th:nth-child(5) { width: 12%; }");
        sb.AppendLine(".treatment-table th:nth-child(6) { width: 6%; }");
        sb.AppendLine(".treatment-table th:nth-child(7) { width: 8%; }");
        sb.AppendLine(".treatment-table th:nth-child(8) { width: 6%; }");
        sb.AppendLine(".treatment-table th:nth-child(9) { width: 8%; }");
        sb.AppendLine(".treatment-table th:nth-child(10) { width: 6%; }");
        sb.AppendLine(".text-center { text-align: center; }");
        sb.AppendLine(".text-right { text-align: right; }");
        sb.AppendLine(".payment-table th:nth-child(1) { width: 20%; }");
        sb.AppendLine(".payment-table th:nth-child(2) { width: 20%; }");
        sb.AppendLine(".payment-table th:nth-child(3) { width: 60%; }");
        sb.AppendLine(".amount { color: #e91e63; font-weight: 600; }");

        // SỬA: Empty message nền đen, chữ trắng
        sb.AppendLine(".empty-message { text-align: center; padding: 30px; color: #fff; font-style: italic; background: #222; border-radius: 8px; border: 2px dashed #444; }");

        // SỬA: Tránh bị cắt bảng/text/section/tiêu đề khi sang trang in/pdf
        sb.AppendLine("section, .patient-info, .empty-message, .appointment-section, table, ul { page-break-inside: avoid; break-inside: avoid; }");
        sb.AppendLine("h3, .title { page-break-after: avoid; break-after: avoid; }");
        sb.AppendLine("p, li, td, th { page-break-inside: avoid; break-inside: avoid; }");

        sb.AppendLine(".appointment-section { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 20px; border-radius: 10px; border-left: 5px solid #26c6da; }");
        sb.AppendLine(".appointment-section p { margin: 8px 0; color: #00695c; font-weight: 500; }");
        sb.AppendLine(".appointment-section strong { color: #004d40; }");
        sb.AppendLine("</style></head><body>");

        sb.AppendLine("<div class='container'>");

        // Header với logo
        sb.AppendLine("<div class='header'>");
        sb.AppendLine("<div class='logo-section'>");
        sb.AppendLine($"<img src='{imageSrc}' alt='Logo' />");
        sb.AppendLine("<div class='clinic-name'>HOLASMILE DENTAL</div>");
        sb.AppendLine("</div>");
        sb.AppendLine("<div class='title'>PHIẾU KHÁM RĂNG</div>");
        sb.AppendLine($"<div class='print-date'>Ngày in: {sheet.PrintedAt:dd/MM/yyyy HH:mm}</div>");
        sb.AppendLine("</div>");

        // Thông tin bệnh nhân
        sb.AppendLine("<section>");
        sb.AppendLine("<div class='patient-info'>");
        sb.AppendLine($"<p><strong>Tên bệnh nhân:</strong> {sheet.PatientName ?? "N/A"}</p>");
        sb.AppendLine($"<p><strong>Ngày sinh:</strong> {(sheet.BirthYear)}</p>");
        sb.AppendLine($"<p><strong>Điện thoại:</strong> {sheet.Phone ?? "N/A"}</p>");
        sb.AppendLine($"<p><strong>Địa chỉ:</strong> {sheet.Address ?? "N/A"}</p>");
        sb.AppendLine("</div>");
        sb.AppendLine("</section>");

        // Chi tiết điều trị
        sb.AppendLine("<hr /><section>");
        sb.AppendLine("<h3>1. Chi tiết điều trị</h3>");
        if (sheet.Treatments?.Any() == true)
        {
            sb.AppendLine("<table class='treatment-table'>");
            sb.AppendLine("<tr>");
            sb.AppendLine("<th>Ngày</th><th>Thủ thuật</th><th>Triệu chứng</th><th>Chẩn đoán</th>");
            sb.AppendLine("<th>Nha sĩ</th><th>SL</th><th>Đơn giá</th>");
            sb.AppendLine("<th>Giảm</th><th>Tổng</th><th>BH</th>");
            sb.AppendLine("</tr>");

            foreach (var t in sheet.Treatments)
            {
                sb.AppendLine("<tr>");
                sb.AppendLine($"<td class='text-center'>{t.TreatmentDate:dd/MM/yyyy}</td>");
                sb.AppendLine($"<td>{t.ProcedureName ?? "-"}</td>");
                sb.AppendLine($"<td>{t.Symptoms ?? "-"}</td>");
                sb.AppendLine($"<td>{t.Diagnosis ?? "-"}</td>");
                sb.AppendLine($"<td>{t.DentistName ?? "-"}</td>");
                sb.AppendLine($"<td class='text-center'>{t.Quantity}</td>");
                sb.AppendLine($"<td class='text-right amount'>{t.UnitPrice:N0}₫</td>");
                sb.AppendLine($"<td class='text-right amount'>{t.Discount:N0}₫</td>");
                sb.AppendLine($"<td class='text-right amount'>{t.TotalAmount:N0}₫</td>");
                sb.AppendLine($"<td class='text-center'>{t.WarrantyTerm ?? 0}</td>");
                sb.AppendLine("</tr>");
            }
            sb.AppendLine("</table>");
        }
        else
        {
            sb.AppendLine("<div class='empty-message'>Không có thông tin điều trị</div>");
        }
        sb.AppendLine("</section>");

        // Đơn thuốc
        sb.AppendLine("<hr /><section>");
        sb.AppendLine("<h3>2. Đơn thuốc</h3>");
        if (sheet.PrescriptionItems?.Any() == true)
        {
            sb.AppendLine("<ul>");
            foreach (var p in sheet.PrescriptionItems)
                sb.AppendLine($"<li>{p}</li>");
            sb.AppendLine("</ul>");
        }
        else
        {
            sb.AppendLine("<div class='empty-message'>Không có đơn thuốc</div>");
        }
        sb.AppendLine("</section>");

        // Hướng dẫn
        sb.AppendLine("<hr /><section>");
        sb.AppendLine("<h3>3. Hướng dẫn</h3>");
        if (sheet.Instructions?.Any() == true)
        {
            sb.AppendLine("<ul>");
            foreach (var i in sheet.Instructions)
                sb.AppendLine($"<li>{i}</li>");
            sb.AppendLine("</ul>");
        }
        else
        {
            sb.AppendLine("<div class='empty-message'>Không có hướng dẫn</div>");
        }
        sb.AppendLine("</section>");

        // Lịch sử thanh toán
        sb.AppendLine("<hr /><section>");
        sb.AppendLine("<h3>4. Lịch sử thanh toán</h3>");
        if (sheet.Payments?.Any() == true)
        {
            sb.AppendLine("<table class='payment-table'>");
            sb.AppendLine("<tr><th>Ngày</th><th>Số tiền</th><th>Ghi chú</th></tr>");
            foreach (var pay in sheet.Payments)
            {
                sb.AppendLine("<tr>");
                sb.AppendLine($"<td class='text-center'>{pay.Date:dd/MM/yyyy}</td>");
                sb.AppendLine($"<td class='text-right amount'>{pay.Amount:N0}₫</td>");
                sb.AppendLine($"<td>{pay.Note ?? "-"}</td>");
                sb.AppendLine("</tr>");
            }
            sb.AppendLine("</table>");
        }
        else
        {
            sb.AppendLine("<div class='empty-message'>Không có lịch sử thanh toán</div>");
        }
        sb.AppendLine("</section>");

        // Lịch hẹn tiếp theo
        if (!string.IsNullOrWhiteSpace(sheet.NextAppointmentTime))
        {
            sb.AppendLine("<hr /><section>");
            sb.AppendLine("<div class='appointment-section'>");
            sb.AppendLine("<h3>5. Lịch hẹn tiếp theo</h3>");
            sb.AppendLine($"<p><strong>Thời gian:</strong> {sheet.NextAppointmentTime}</p>");
            sb.AppendLine($"<p><strong>Ghi chú:</strong> {sheet.NextAppointmentNote ?? "-"}</p>");
            sb.AppendLine("</div>");
            sb.AppendLine("</section>");
        }

        sb.AppendLine("</div>"); // End container
        sb.AppendLine("</body></html>");
        return sb.ToString();
    }


    public string RenderInvoiceToHtml(ViewInvoiceDto invoice)
    {
        var imagePath = "wwwroot/Logo/Logo.png";
        var imageBytes = File.ReadAllBytes(imagePath);
        var base64Image = Convert.ToBase64String(imageBytes);
        var imageSrc = $"data:image/png;base64,{base64Image}";

        var sb = new StringBuilder();
        sb.AppendLine("<html lang='vi'><head><meta charset='UTF-8'><style>");
        sb.AppendLine(@"
            body {
                font-family: 'Times New Roman', serif;
                font-size: 14px;
                margin: 40px;
            }
            .note-top {
                text-align: center;
                font-style: italic;
                font-size: 12px;
            }
            .logo-text {
                font-weight: bold;
                color: orange;
                font-size: 14px;
                margin-top: 5px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
            }
            th, td {
                padding: 6px;
                text-align: left;
            }
            .table-bordered th, .table-bordered td {
                border: 1px solid black;
                text-align: center;
            }
            .text-center {
                text-align: center;
            }
            .text-right {
                text-align: right;
            }
            .amount {
                color: red;
                font-weight: bold;
            }
            .signature {
                margin-top: 60px;
                width: 100%;
            }
            .signature td {
                text-align: center;
                padding-top: 40px;
            }
            .bottom-note {
                margin-top: 40px;
                font-size: 12px;
                font-style: italic;
                text-align: center;
            }
        ");
        sb.AppendLine("</style></head><body>");

        sb.AppendLine("<div class='note-top'>Đơn vị cung cấp giải pháp hóa đơn điện tử: Tập đoàn Bưu chính Viễn thông Việt Nam. Điện thoại: 18001260</div>");

        // Header
        sb.AppendLine("<table>");
        sb.AppendLine("<tr>");
        sb.AppendLine("<td style='width: 25%; vertical-align: top;'>");
        sb.AppendLine($"<img src='{imageSrc}' style='height: 70px;' /><div class='logo-text'>HOLASMILE DENTAL</div>");
        sb.AppendLine("</td>");
        sb.AppendLine("<td style='width: 50%; text-align: center;'>");
        sb.AppendLine("<div style='font-size: 20px; color: red; font-weight: bold;'>HÓA ĐƠN GIÁ TRỊ GIA TĂNG</div>");
        sb.AppendLine("<div style='font-style: italic;'>(VAT INVOICE)</div>");
        sb.AppendLine($"<div>Ngày (Date) {DateTime.Now:dd} &nbsp;&nbsp; tháng (month) {DateTime.Now:MM} &nbsp;&nbsp; năm (year) {DateTime.Now:yyyy}</div>");
        sb.AppendLine("</td>");
        sb.AppendLine("<td style='width: 25%; text-align: right;'>");
        sb.AppendLine("Ký hiệu (Series): <b style='color: red;'>1K25TAA</b><br/>");
        sb.AppendLine($"Số (No.): <b style='color: red;'>{invoice.OrderCode}</b>");
        sb.AppendLine("</td>");
        sb.AppendLine("</tr>");
        sb.AppendLine("</table>");

        // Thông tin người bán và người mua
        sb.AppendLine("<br/><table>");
        sb.AppendLine("<tr><td><strong>Tên đơn vị bán hàng (Seller):</strong> <span style='color:red;'>HOLASMILE DENTAL</span></td></tr>");
        sb.AppendLine("<tr><td><strong>Mã số thuế (Tax code):</strong> 0102100740</td></tr>");
        sb.AppendLine("<tr><td><strong>Địa chỉ (Address):</strong> Km29 Đại lộ Thăng Long, H.Thạch Thất, TP Hà Nội</td></tr>");
        sb.AppendLine($"<tr><td><strong>Hình thức thanh toán (Payment method):</strong> {(invoice.PaymentMethod == "payos" ? "Chuyển khoản" : "Tiền mặt")}</td></tr>");
        sb.AppendLine($"<tr><td><strong>Tên người mua hàng (Buyer):</strong> {invoice.PatientName}</td></tr>");
        sb.AppendLine("</table>");

        // Bảng hàng hóa (CÓ VIỀN)
        sb.AppendLine("<br/><table class='table-bordered'>");
        sb.AppendLine("<tr><th>STT (No.)</th><th>Mô tả (Description)</th><th>Đơn vị (Unit)</th><th>Số lượng (Qty)</th><th>Đơn giá (Unit price)</th><th>Thành tiền (Amount)</th></tr>");
        sb.AppendLine("<tr>");
        sb.AppendLine("<td>1</td>");
        sb.AppendLine("<td>Thanh toán điều trị</td>");
        sb.AppendLine("<td>Đợt</td>");
        sb.AppendLine("<td>1</td>");
        sb.AppendLine($"<td>{invoice.PaidAmount:N0}</td>");
        sb.AppendLine($"<td>{invoice.PaidAmount:N0}</td>");
        sb.AppendLine("</tr>");
        sb.AppendLine("</table>");

        // Tổng tiền
        sb.AppendLine("<br/><table>");
        sb.AppendLine("<tr><td><strong>Thuế suất GTGT (VAT rate):</strong> KCT</td></tr>");
        sb.AppendLine($"<tr><td><strong>Tổng cộng tiền thanh toán (Total payment):</strong> <span class='amount'>{invoice.PaidAmount:N0} VND</span></td></tr>");
        sb.AppendLine($"<tr><td><strong>Số tiền viết bằng chữ (Amount in words):</strong> {ConvertAmountToWords(invoice.PaidAmount)}</td></tr>");
        sb.AppendLine("</table>");

        // Chữ ký
        sb.AppendLine("<table class='signature'>");
        sb.AppendLine("<tr>");
        sb.AppendLine("<td>NGƯỜI MUA HÀNG<br/>(Buyer)<br/><br/><i>Ký, ghi rõ họ tên</i></td>");
        sb.AppendLine("<td>NGƯỜI BÁN HÀNG<br/>(Seller)<br/><br/><i>Ký, đóng dấu, ghi rõ họ tên</i></td>");
        sb.AppendLine("</tr>");
        sb.AppendLine("</table>");

        // Ghi chú cuối
        sb.AppendLine("<div class='bottom-note'>Cần kiểm tra, đối chiếu khi lập, giao, nhận hóa đơn.<br/>Tra cứu hóa đơn tại: https://fpt-tt78.vnpt-invoice.com.vn/</div>");

        sb.AppendLine("</body></html>");
        return sb.ToString();
    }

    public static string ConvertAmountToWords(decimal? amount)
    {
        string[] units = { "", "nghìn", "triệu", "tỷ" };
        string[] digits = { "không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín" };

        if (amount == 0) return "Không đồng";

        long num = (long)amount;
        string result = "";
        int unitIndex = 0;
        bool hasPreviousGroup = false;

        while (num > 0)
        {
            int threeDigits = (int)(num % 1000);

            if (threeDigits != 0)
            {
                string groupWords = ReadThreeDigits(threeDigits, digits, hasPreviousGroup);
                result = groupWords + " " + units[unitIndex] + " " + result;
                hasPreviousGroup = true;
            }

            num /= 1000;
            unitIndex++;
        }

        result = result.Trim();
        result = char.ToUpper(result[0]) + result.Substring(1) + " đồng";
        return result;
    }

    private static string ReadThreeDigits(int number, string[] digits, bool full)
    {
        int hundreds = number / 100;
        int tens = (number % 100) / 10;
        int ones = number % 10;
        string result = "";

        if (hundreds > 0)
        {
            result += digits[hundreds] + " trăm ";
        }
        else if (full && (tens > 0 || ones > 0))
        {
            result += "không trăm ";
        }

        if (tens > 1)
        {
            result += digits[tens] + " mươi ";
            if (ones == 1)
                result += "mốt ";
            else if (ones == 5)
                result += "lăm ";
            else if (ones > 0)
                result += digits[ones] + " ";
        }
        else if (tens == 1)
        {
            result += "mười ";
            if (ones == 5)
                result += "lăm ";
            else if (ones > 0)
                result += digits[ones] + " ";
        }
        else if (ones > 0)
        {
            if (tens > 0 || hundreds > 0)
                result += "lẻ ";
            result += digits[ones] + " ";
        }

        return result.Trim();
    }
}
