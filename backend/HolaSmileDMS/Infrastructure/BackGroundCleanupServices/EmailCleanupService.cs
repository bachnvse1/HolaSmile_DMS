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
                        var subject = $"Nhắc lịch hẹn nha khoa tại HolaSmile vào {app.AppointmentDate:HH:mm dd/MM/yyyy}";
                        // Gửi email thông báo
                        var message = $"<p>Xin chào {app.Patient.User.Fullname},</p>" +
              $"<p>Đây là email nhắc bạn về lịch hẹn nha khoa tại <b>HolaSmile</b> sẽ diễn ra vào lúc <b>{app.AppointmentDate:HH:mm dd/MM/yyyy}</b>.</p>" +
              "<p>Vui lòng đến đúng giờ để không ảnh hưởng đến quá trình điều trị. Nếu bạn không thể đến được, hãy liên hệ với chúng tôi để sắp xếp lại lịch hẹn.</p>" +
              "<p>Trân trọng,<br/>Phòng khám nha khoa HolaSmile</p>";
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
