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

        var paidAmount = invoice.PaidAmount ?? 0;
        var remainingAmount = invoice.RemainingAmount ?? 0;
        var totalAmount = invoice.TotalAmount;

        var sb = new StringBuilder();
        sb.AppendLine("<html lang='vi'><head><meta charset='UTF-8'><style>");
        sb.AppendLine(@"
            body {
                font-family: 'Segoe UI', Arial, sans-serif;
                background: #b6caff;
                margin: 0;
                padding: 0;
            }
            .invoice-container {
                max-width: 800px;             /* tăng chiều rộng để nội dung, chữ ký rộng rãi */
                min-height: 760px;            /* đảm bảo chiều cao cho chỗ ký tay */
                margin: 80px auto 40px auto;  /* nhiều khoảng cách phía trên, căn giữa */
                background: #fff;
                border-radius: 18px;
                box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.18);
                padding: 36px 50px 70px 50px; /* padding dưới nhiều hơn cho phần chữ ký */
                position: relative;
            }
            .blue-corner {
                position: absolute;
                top: 0; right: 0;
                width: 140px; height: 90px;
                background: linear-gradient(130deg, #e3edff 60%, #d2e0fc 100%);
                border-radius: 0 15px 0 120px;
                z-index: 0;
            }
            .invoice-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
            }
            .logo-title {
                display: flex;
                align-items: center;
                gap: 16px;
            }
            .logo-title img {
                height: 56px;
                margin-right: 8px;
            }
            .clinic-name {
                font-size: 22px;
                color: #16348a;
                font-weight: bold;
                margin-bottom: 2px;
            }
            .clinic-address {
                font-size: 13px;
                color: #6b7fa6;
                margin-bottom: 3px;
            }
            .clinic-hotline {
                font-size: 13px;
                color: #3366cc;
            }
            .invoice-title {
                font-size: 24px;
                color: #1976d2;
                font-weight: bold;
                text-align: right;
                margin-top: 6px;
                text-shadow: 0 2px 8px rgba(26,35,126,0.08);
            }
            .sub-title {
                font-size: 13px;
                color: #888;
                font-weight: 500;
                text-align: right;
            }
            .info-row {
                margin-top: 26px;
                display: flex;
                justify-content: space-between;
                font-size: 15px;
            }
            .info-group {
                width: 48%;
            }
            .info-label {
                color: #1a237e;
                font-weight: 600;
                margin-bottom: 3px;
            }
            .info-value {
                color: #1976d2;
                font-weight: 500;
            }
            .invoice-table {
                width: 100%;
                border-collapse: collapse;
                margin: 34px 0 20px 0;
                font-size: 15px;
                background: #f8fbff;
                border-radius: 8px;
                overflow: hidden;
            }
            .invoice-table th {
                background: #16348a;
                color: #fff;
                padding: 10px 0;
                font-weight: bold;
                font-size: 15px;
                letter-spacing: 1px;
            }
            .invoice-table td {
                text-align: center;
                padding: 9px 0;
                border-bottom: 1px solid #e5eaf7;
            }
            .invoice-table tr:nth-child(even) td {
                background: #e3edff;
            }
            .amount-summary {
                float: right;
                width: 320px;
                margin-bottom: 8px;
            }
            .amount-summary td {
                padding: 6px 0;
                font-size: 15px;
            }
            .amount-summary .label {
                color: #1a237e;
                font-weight: 600;
                text-align: right;
            }
            .amount-summary .value {
                font-weight: 600;
                text-align: right;
            }
            .amount-summary .total-label {
                font-size: 17px;
                color: #16348a;
            }
            .amount-summary .total-value {
                font-size: 17px;
                color: #1976d2;
                font-weight: bold;
            }
            .amount-words {
                clear: both;
                font-size: 13px;
                margin-top: 8px;
                color: #555;
                font-style: italic;
            }
            .contact-section {
                margin-top: 20px;
                font-size: 13px;
                color: #364152;
            }
            .terms-section {
                font-size: 13px;
                color: #546e7a;
                margin-top: 16px;
            }
            .terms-section strong {
                color: #1976d2;
            }

            /* Responsive */
            @media (max-width: 900px) {
                .invoice-container {
                    max-width: 98vw;
                    padding: 18px 6vw 60px 6vw;
                }
                .amount-summary {
                    width: 98vw;
                }
                .invoice-header { flex-direction: column; gap: 12px; }
                .info-row { flex-direction: column; gap: 10px; }
            }

        ");
        sb.AppendLine("</style></head><body>");
        sb.AppendLine("<div style=\"height: 100px;\"></div>\n");
        sb.AppendLine("<div class='invoice-container'>");
        sb.AppendLine("<div class='blue-corner'></div>");
        sb.AppendLine("<div class='invoice-header'>");
        sb.AppendLine("<div class='logo-title'>");
        sb.AppendLine($"<img src='{imageSrc}' alt='Logo' />");
        sb.AppendLine("<div>");
        sb.AppendLine("<div class='clinic-name'>HOLASMILE DENTAL</div>");
        sb.AppendLine("<div class='clinic-address'>Km29 Đại lộ Thăng Long, H.Thạch Thất, TP Hà Nội</div>");
        sb.AppendLine("<div class='clinic-hotline'>Hotline: 18001260</div>");
        sb.AppendLine("</div>");
        sb.AppendLine("</div>");
        sb.AppendLine("<div>");
        sb.AppendLine("<div class='invoice-title'>HÓA ĐƠN THANH TOÁN DỊCH VỤ NHA KHOA</div>");
        sb.AppendLine("<div class='sub-title'>(Dental Invoice)</div>");
        sb.AppendLine("</div>");
        sb.AppendLine("</div>");

        // Info hóa đơn & khách hàng
        sb.AppendLine("<div class='info-row'>");
        sb.AppendLine("<div class='info-group'>");
        sb.AppendLine("<div class='info-label'>Khách hàng:</div>");
        sb.AppendLine($"<div class='info-value'>{invoice.PatientName ?? "N/A"}</div>");
        sb.AppendLine("<div class='info-label'>Địa chỉ:</div>");
        sb.AppendLine($"<div class='info-value'>{invoice.PatientAddress ?? "N/A"}</div>");
        sb.AppendLine("</div>");
        sb.AppendLine("<div class='info-group'>");
        sb.AppendLine("<div class='info-label'>Mã hóa đơn:</div>");
        sb.AppendLine($"<div class='info-value'>{invoice.OrderCode ?? "N/A"}</div>");
        sb.AppendLine("<div class='info-label'>Ngày thanh toán:</div>");
        sb.AppendLine($"<div class='info-value'>{invoice.PaymentDate:dd/MM/yyyy}</div>");
        sb.AppendLine("<div class='info-label'>Phương thức thanh toán:</div>");
        sb.AppendLine($"<div class='info-value'>{(invoice.PaymentMethod ?? "N/A").ToUpper()}</div>");
        sb.AppendLine("</div>");
        sb.AppendLine("</div>");

        // Bảng dịch vụ
        sb.AppendLine("<table class='invoice-table'>");
        sb.AppendLine("<tr>");
        sb.AppendLine("<th>STT</th>");
        sb.AppendLine("<th>Mô tả</th>");
        sb.AppendLine("<th>Đơn vị</th>");
        sb.AppendLine("<th>Số lượng</th>");
        sb.AppendLine("<th>Đơn giá</th>");
        sb.AppendLine("<th>Thành tiền</th>");
        sb.AppendLine("</tr>");
        sb.AppendLine("<tr>");
        sb.AppendLine("<td>1</td>");
        sb.AppendLine("<td style='text-align:left;padding-left:6px'>Thanh toán điều trị</td>");
        sb.AppendLine("<td>Đợt</td>");
        sb.AppendLine("<td>1</td>");
        sb.AppendLine($"<td>{paidAmount:N0}₫</td>");
        sb.AppendLine($"<td>{paidAmount:N0}₫</td>");
        sb.AppendLine("</tr>");
        sb.AppendLine("</table>");

        // Tổng tiền, VAT, số tiền bằng chữ
        sb.AppendLine("<table class='amount-summary'>");
        sb.AppendLine($"<tr><td class='label'>Tạm tính</td><td class='value'>{paidAmount:N0}₫</td></tr>");
        sb.AppendLine("<tr><td class='label'>VAT</td><td class='value'>0₫</td></tr>");
        sb.AppendLine($"<tr><td class='total-label'>Tổng thanh toán</td><td class='total-value'>{paidAmount:N0}₫</td></tr>");
        if (remainingAmount > 0)
            sb.AppendLine($"<tr><td class='label'>Còn lại</td><td class='value'>{remainingAmount:N0}₫</td></tr>");
        sb.AppendLine("</table>");
        sb.AppendLine("<div style='clear:both'></div>");

        sb.AppendLine($"<div class='amount-words'>Bằng chữ: <strong>{ConvertAmountToWords((long)paidAmount)}</strong></div>");

        // Thông tin liên hệ & điều khoản
        sb.AppendLine("<div class='contact-section'>");
        sb.AppendLine("Mọi thắc mắc liên hệ: 18001260 hoặc email: info@holasmile.com<br/>");
        sb.AppendLine("</div>");
        sb.AppendLine("<div class='terms-section'><strong>Ghi chú:</strong> Hóa đơn này là căn cứ để đối chiếu, khiếu nại (nếu có). Quý khách vui lòng giữ hóa đơn cẩn thận.</div>");

        // Chữ ký
        // Chữ ký - DÙNG TABLE CHO CHẮC
        sb.AppendLine(@"<table style='width:100%;margin-top:38px;'>
          <tr>
            <td style='width:50%;text-align:center;vertical-align:top;'>
              <div style='font-weight:bold;color:#16348a;'>Khách hàng</div>
              <div style='font-size:13px;color:#888;margin-top:6px;'>(Ký, ghi rõ họ tên)</div>
            </td>
            <td style='width:50%;text-align:center;vertical-align:top;'>
              <div style='font-weight:bold;color:#16348a;'>Người lập hóa đơn</div>
              <div style='font-size:13px;color:#888;margin-top:6px;'>(Ký, ghi rõ họ tên)</div>
            </td>
          </tr>
        </table>");


        sb.AppendLine("</div>"); // End container
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
