using Application.Interfaces;
using HDMS_API.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Infrastructure.BackGroundCleanupServices
{
    public class EmailCleanupService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        public EmailCleanupService(
            IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }
        protected override async System.Threading.Tasks.Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using var scope = _scopeFactory.CreateScope();
                var appointmentRepo = scope.ServiceProvider
                                            .GetRequiredService<IAppointmentRepository>();
                var emailRepo = scope.ServiceProvider
                                            .GetRequiredService<IEmailService>();
                var appointments = await appointmentRepo.GetAllAppointments() ?? new List<Appointment>();
                foreach (var app in appointments)
                {
                    if(app.AppointmentDate.Date == DateTime.Now.Date.AddDays(1) && app.Status == "confirmed" && app.Patient?.User?.Email != null)
                    {
                        var subject = $"Nhắc lịch hẹn nha khoa tại HolaSmile vào {app.AppointmentDate.ToString("dd/MM/yyyy")} lúc {app.AppointmentTime}";
                        // Gửi email thông báo
                        var domain = "http://localhost:5173/";

                        var message = $@"
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <meta charset='UTF-8'>
                          <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                          <title>Nhắc lịch hẹn - HolaSmile</title>
                        </head>
                        <body style='margin:0;padding:0;background-color:#f6f9fc;font-family:Arial,Helvetica,sans-serif;'>
                          <table role='presentation' cellpadding='0' cellspacing='0' width='100%' style='background-color:#f6f9fc;'>
                            <tr>
                              <td align='center' style='padding:32px 16px;'>
                                <table role='presentation' cellpadding='0' cellspacing='0' width='600' style='max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);'>
                                  
                                  <!-- Header -->
                                  <tr>
                                    <td style='background:#4a90e2;padding:20px 24px;text-align:center;color:#ffffff;'>
                                      <h1 style='margin:0;font-size:22px;line-height:1.3;'>Nhắc lịch hẹn nha khoa</h1>
                                      <p style='margin:6px 0 0;font-size:14px;opacity:0.95;'>HolaSmile Dental Clinic</p>
                                    </td>
                                  </tr>

                                  <!-- Content -->
                                  <tr>
                                    <td style='padding:28px 24px 8px;color:#333333;font-size:16px;line-height:1.6;'>
                                      <p style='margin:0 0 14px;'>Xin chào <strong>{app.Patient.User.Fullname}</strong>,</p>
                                      <p style='margin:0 0 14px;'>Đây là email nhắc bạn về lịch hẹn nha khoa tại <strong>HolaSmile</strong> sẽ diễn ra vào:</p>

                                      <table role='presentation' cellpadding='0' cellspacing='0' width='100%' style='margin:16px 0 8px;'>
                                        <tr>
                                          <td style='background:#f8fbff;border:1px solid #e6eef9;border-radius:8px;padding:14px 16px;'>
                                            <p style='margin:0;font-size:15px;'>
                                              <strong style='display:inline-block;min-width:86px;'>Ngày:</strong> {app.AppointmentDate:dd/MM/yyyy}<br/>
                                              <strong style='display:inline-block;min-width:86px;'>Giờ:</strong> {app.AppointmentTime}
                                            </p>
                                          </td>
                                        </tr>
                                      </table>

                                      <p style='margin:16px 0 0;'>Vui lòng đến đúng giờ để không ảnh hưởng đến quá trình điều trị. 
                                      Nếu bạn không thể đến được, hãy liên hệ với chúng tôi để sắp xếp lại lịch hẹn.</p>
                                    </td>
                                  </tr>

                                  <!-- CTA Button -->
                                  <tr>
                                    <td style='padding:8px 24px 4px;text-align:center;'>
                                      <a href='{(string.IsNullOrWhiteSpace(domain) ? "#" : domain)}' 
                                         style='background:#4a90e2;color:#ffffff;text-decoration:none;
                                                display:inline-block;padding:12px 20px;border-radius:8px;
                                                font-weight:bold;font-size:15px;'>
                                        Xem chi tiết lịch hẹn
                                      </a>
                                    </td>
                                  </tr>

                                  <!-- Divider -->
                                  <tr>
                                    <td style='padding:8px 24px;'>
                                      <hr style='border:none;border-top:1px solid #eee;margin:8px 0 0;' />
                                    </td>
                                  </tr>

                                  <!-- Footer -->
                                  <tr>
                                    <td style='padding:14px 24px 22px;color:#666;font-size:13px;line-height:1.6;text-align:center;background:#fafafa;'>
                                      <p style='margin:0 0 6px;'>Trân trọng,<br/>Phòng khám nha khoa HolaSmile</p>
                                      <p style='margin:0;opacity:0.85;'>© {DateTime.Now:yyyy} HolaSmile Dental Clinic</p>
                                    </td>
                                  </tr>

                                </table>
                              </td>
                            </tr>
                          </table>
                        </body>
                        </html>";

                        await emailRepo.SendEmailAsync(app.Patient.User.Email,message,subject);
                    }
                }

                var now = DateTime.Now;
                var nextMidnight = now.Date.AddDays(1);
                var delay = nextMidnight - now;
                await System.Threading.Tasks.Task.Delay(delay, stoppingToken);
            }
        }
    }
}
