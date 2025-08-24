using Application.Interfaces;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Infrastructure.BackGroundServices
{
    public class AppointmentCleanupService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IMediator _mediator;

        public AppointmentCleanupService(
            IServiceScopeFactory scopeFactory,
            IMediator mediator)
        {
            _scopeFactory = scopeFactory;
            _mediator = mediator;
        }

        protected override async System.Threading.Tasks.Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var appointmentRepo = scope.ServiceProvider.GetRequiredService<IAppointmentRepository>();
                    var dentistRepo = scope.ServiceProvider.GetRequiredService<IDentistRepository>();
                    var patientRepo = scope.ServiceProvider.GetRequiredService<IPatientRepository>();
                    var userCommonRepository = scope.ServiceProvider.GetRequiredService<IUserCommonRepository>();

                    var confirmAppointments = await appointmentRepo.GetAllCofirmAppoitmentAsync(); // Sửa tên hàm

                    if (confirmAppointments != null && confirmAppointments.Count > 0)
                    {
                        foreach (var appointment in confirmAppointments)
                        {
                            if (appointment.AppointmentDate.AddDays(1) < DateTime.Now)
                            {
                                appointment.Status = "absented";
                                var result = await appointmentRepo.UpdateAppointmentAsync(appointment);
                                if (!result)
                                {
                                    continue;
                                }

                                try
                                {
                                    var dentist = await dentistRepo.GetDentistByDentistIdAsync(appointment.DentistId);
                                    var patient = await patientRepo.GetPatientByPatientIdAsync(appointment.PatientId);
                                    var receptionists = await userCommonRepository.GetAllReceptionistAsync();

                                    if (patient?.User != null)
                                    {
                                        await _mediator.Send(new SendNotificationCommand(
                                            patient.User.UserID,
                                            "Thay đổi trạng thái lịch",
                                            $"Bạn đã vắng mặt trong lịch hẹn #{appointment.AppointmentId}",
                                            "appointment", 0,
                                            $"patient/appointments/{appointment.AppointmentId}"),
                                            stoppingToken);
                                    }

                                    if (dentist?.User != null)
                                    {
                                        await _mediator.Send(new SendNotificationCommand(
                                            dentist.User.UserID,
                                            "Đặt lịch hẹn tái khám",
                                            $"Bệnh nhân {patient.User.Fullname} đã vắng mặt trong lịch hẹn #{appointment.AppointmentId}",
                                            "appointment", 0,
                                            $"appointments/{appointment.AppointmentId}"),
                                            stoppingToken);
                                    }


                                    var notifyReceptionists = receptionists.Select(async r =>
                                        await _mediator.Send(new SendNotificationCommand(
                                            r.User.UserID,
                                            "Đăng ký khám",
                                            $"Bệnh nhân {patient.User.Fullname} đã vắng mặt trong lịch hẹn #{appointment.AppointmentId}",
                                            "appointment", 0,
                                            $"appointments/{appointment.AppointmentId}"),
                                            stoppingToken)
                                    ).ToList();

                                    await System.Threading.Tasks.Task.WhenAll(notifyReceptionists);
                                }
                                catch (Exception ex)
                                {
                                }
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                }
                var now = DateTime.Now;
                var nextMidnight = now.Date.AddDays(1);
                var delay = nextMidnight - now;
                await System.Threading.Tasks.Task.Delay(delay, stoppingToken);
            }
        }
    }
}
