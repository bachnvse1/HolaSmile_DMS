using Application.Interfaces;
using HDMS_API.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Infrastructure.BackGroundCleanupServices
{
    public class EmailCleanupService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly TimeSpan _interval;
        public EmailCleanupService(
            IServiceScopeFactory scopeFactory,
            TimeSpan? interval = null)
        {
            _scopeFactory = scopeFactory;
            // Cho test dễ override interval; production sẽ dùng 24h
            _interval = interval ?? TimeSpan.FromHours(24);
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
                var appointments =await appointmentRepo.GetAllAppointments();
                if (appointments == null) {
                    appointments = new List<Appointment>(); ;
                }
               foreach (var app in appointments)
                {
                    if(app.AppointmentDate.Date == DateTime.Now.Date.AddDays(1) && app.Status == "confirmed")
                    {
                        Console.WriteLine("da vao dieu kien vao ham");

                        // Gửi email thông báo
                        var message = $"<p>Xin chào {app.Patient.User.Fullname},</p>" +
              $"<p>Đây là email nhắc bạn về lịch hẹn nha khoa tại <b>HolaSmile</b> sẽ diễn ra vào lúc <b>{app.AppointmentDate:HH:mm dd/MM/yyyy}</b>.</p>" +
              "<p>Vui lòng đến đúng giờ để không ảnh hưởng đến quá trình điều trị. Nếu bạn không thể đến được, hãy liên hệ với chúng tôi để sắp xếp lại lịch hẹn.</p>" +
              "<p>Trân trọng,<br/>Phòng khám nha khoa HolaSmile</p>";
                        await emailRepo.SendEmailAsync(app.Patient.User.Email,message);
                    }
                }
                await System.Threading.Tasks.Task.Delay(_interval, stoppingToken);
            }
        }
    }
}
