using System.Net.Mail;
using System.Net;
using HDMS_API.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace HDMS_API.Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task<bool> SendEmailAsync(string toEmail, string message, string subject)
        {
            try
            {
                var smtpServer = _config["EmailSettings:SmtpServer"];
                var smtpPort = int.Parse(_config["EmailSettings:SmtpPort"]);
                var senderEmail = _config["EmailSettings:SenderEmail"];
                var senderPassword = _config["EmailSettings:SenderPassword"];

                using (var client = new SmtpClient(smtpServer, smtpPort))
                {
                    client.Credentials = new NetworkCredential(senderEmail, senderPassword);
                    client.EnableSsl = true;

                    var mailMessage = new MailMessage
                    {
                        From = new MailAddress(senderEmail),
                        Subject = subject,
                        Body = message,
                        IsBodyHtml = true
                    };

                    mailMessage.To.Add(toEmail);
                    await client.SendMailAsync(mailMessage);

                    return true;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending email: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> SendPasswordAsync(string toEmail, string password)
        {
            try
            {
                var smtpServer = _config["EmailSettings:SmtpServer"];
                var smtpPort = int.Parse(_config["EmailSettings:SmtpPort"]);
                var senderEmail = _config["EmailSettings:SenderEmail"];
                var senderPassword = _config["EmailSettings:SenderPassword"];

                using (var client = new SmtpClient(smtpServer, smtpPort))
                {
                    client.Credentials = new NetworkCredential(senderEmail, senderPassword);
                    client.EnableSsl = true;

                    // Lấy domain từ appsettings.json
                    var domain = _config["Frontend:Domain"]; // Ví dụ: http://localhost:5173/

                    var mailMessage = new MailMessage
                    {
                        From = new MailAddress(senderEmail),
                        Subject = "Mật khẩu tài khoản của bạn - HolaSmile",
                        Body = $@"
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset='UTF-8'>
                    </head>
                    <body style='font-family: Arial, sans-serif; background-color: #f6f9fc; margin: 0; padding: 0;'>
                      <table width='100%' cellpadding='0' cellspacing='0'>
                        <tr>
                          <td align='center' style='padding: 40px 0;'>
                            <table width='600' cellpadding='0' cellspacing='0' style='background-color: #ffffff; border-radius: 8px; overflow: hidden;'>
                              <!-- Header -->
                              <tr>
                                <td style='background-color: #4a90e2; padding: 20px; text-align: center; color: white;'>
                                  <h1 style='margin: 0; font-size: 24px;'>Thông tin tài khoản của bạn</h1>
                                </td>
                              </tr>
                              <!-- Content -->
                              <tr>
                                <td style='padding: 30px; color: #333; font-size: 16px;'>
                                  <p>Phòng khám <strong>HolaSmile</strong> gửi bạn thông tin tài khoản.</p>
                                  <p><strong>Tài khoản:</strong> Số điện thoại bạn đã đăng ký tại phòng khám.</p>
                                  <p><strong>Mật khẩu tạm thời của bạn:</strong> 
                                    <span style='background-color:#f8f8f8; padding:5px 10px; border-radius:4px; font-weight:bold; color:#d9534f;'>{password}</span>
                                  </p>
                                  <p style='color:red;'><i>Lưu ý:</i> Bạn nên thay đổi mật khẩu sau khi đăng nhập để đảm bảo an toàn bảo mật.</p>
                                  <p style='margin-top: 30px; text-align: center;'>
                                <a href='{{domain}}' 
                                   style='background-color: #4a90e2; 
                                          color: white; 
                                          padding: 12px 20px; 
                                          border-radius: 5px; 
                                          text-decoration: none; 
                                          font-weight: bold;
                                          display: inline-block;'>
                                  Truy cập ngay
                                </a>
                                    </p>
                                </td>
                              </tr>
                              <!-- Footer -->
                              <tr>
                                <td style='background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 14px; color: #666;'>
                                  © 2025 HolaSmile Dental Clinic - All rights reserved.
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </body>
                    </html>
                    ",
                        IsBodyHtml = true
                    };

                    mailMessage.To.Add(toEmail);
                    await client.SendMailAsync(mailMessage);

                    return true;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending email: {ex.Message}");
                return false;
            }
        }
    }
}
