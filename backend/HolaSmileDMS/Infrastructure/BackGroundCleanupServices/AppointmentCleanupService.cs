using Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Infrastructure.BackGroundServices
{
    public class AppointmentCleanupService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly TimeSpan _interval;
        public AppointmentCleanupService(
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
                // Tạo scope mới cho mỗi lần chạy
                using var scope = _scopeFactory.CreateScope();
                var appointmentRepo = scope.ServiceProvider
                                            .GetRequiredService<IAppointmentRepository>();
                // Xử lý logic xóa appointment cũ ở đây
                var confirmAppointments = await appointmentRepo.GetAllCofirmAppoitmentAsync();
                if (confirmAppointments != null && confirmAppointments.Count > 0)
                {
                    foreach (var appointment in confirmAppointments)
                    {
                        // Kiểm tra nếu appointment đã quá hạn
                        if (appointment.AppointmentDate.AddDays(1) < DateTime.Now)
                        {
                            // Xóa appointment
                            appointment.Status = "absented";
                            var result = await appointmentRepo.UpdateAppointmentAsync(appointment);
                            if (!result)
                            {
                                throw new Exception("tự động thay đổi trạng thái lịch thất bại");
                                // Log lỗi nếu cần
                                // Ví dụ: Console.WriteLine($"Failed to update appointment {appointment.AppointmentId}");
                            }
                        }
                    }
                }
                await System.Threading.Tasks.Task.Delay(_interval, stoppingToken);
            }
        }
    }
}
