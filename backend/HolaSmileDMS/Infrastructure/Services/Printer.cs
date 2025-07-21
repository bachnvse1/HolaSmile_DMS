using System.Text;
using Application.Services;
using Application.Usecases.Patients.ViewDentalRecord;
using Application.Usecases.Patients.ViewInvoices;

namespace Infrastructure.Services;

public class Printer : IPrinter
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
