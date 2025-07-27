using Application.Interfaces;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Infrastructure.BackGroundServices
{
    public class AppointmentCleanupService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IMediator _mediator;
        public AppointmentCleanupService(
            IServiceScopeFactory scopeFactory, IMediator mediator)
        {
            _scopeFactory = scopeFactory;
            _mediator = mediator;
        }
        protected override async System.Threading.Tasks.Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                // Tạo scope mới cho mỗi lần chạy
                using var scope = _scopeFactory.CreateScope();
                var appointmentRepo = scope.ServiceProvider.GetRequiredService<IAppointmentRepository>();
                var dentistRepo = scope.ServiceProvider.GetRequiredService<IDentistRepository>();
                var patientRepo = scope.ServiceProvider.GetRequiredService<IPatientRepository>();

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

                            try
                            {
                                var dentist = await dentistRepo.GetDentistByDentistIdAsync(appointment.DentistId);
                                var patient = await patientRepo.GetPatientByPatientIdAsync(appointment.PatientId);

                                if (patient?.User != null)
                                {
                                    await _mediator.Send(new SendNotificationCommand(
                                        patient.User.UserID,
                                        "Thay đổi trạng thái lịch",
                                        $"Bệnh nhân đã vắng mặt trong lịch hẹn {appointment.AppointmentId}",
                                        "appointment", 0, $"appointments/{appointment.AppointmentId}"), stoppingToken);
                                }

                                if (dentist?.User != null)
                                {
                                    await _mediator.Send(new SendNotificationCommand(
                                        dentist.User.UserID,
                                        "Đặt lịch hẹn tái khám",
                                        $"Bệnh nhân đã vắng mặt trong lịch hẹn {appointment.AppointmentId}",
                                        "appointment", 0, $"appointments/{appointment.AppointmentId}"), stoppingToken);
                                }
                            }
                            catch
                            {
                            }
                        }
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
