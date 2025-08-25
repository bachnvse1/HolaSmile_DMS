using Application.Interfaces;
using Application.Usecases.SendNotification;
using Infrastructure.BackGroundServices;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Infrastructure.BackGroundServices
{
    public class AppointmentCleanupServiceTests
    {
        private readonly Mock<IAppointmentRepository> _appointmentRepoMock = new();
        private readonly Mock<IDentistRepository> _dentistRepoMock = new();
        private readonly Mock<IPatientRepository> _patientRepoMock = new();
        private readonly Mock<IUserCommonRepository> _userCommonRepoMock = new();
        private readonly Mock<IMediator> _mediatorMock = new();
        private readonly Mock<ILogger<AppointmentCleanupService>> _loggerMock = new();

        private IServiceScopeFactory BuildServiceProvider()
        {
            var services = new ServiceCollection();

            services.AddSingleton(_appointmentRepoMock.Object);
            services.AddSingleton(_dentistRepoMock.Object);
            services.AddSingleton(_patientRepoMock.Object);
            services.AddSingleton(_userCommonRepoMock.Object);

            return services.BuildServiceProvider().GetRequiredService<IServiceScopeFactory>();
        }

        /// <summary>
        /// Hàm helper để chạy 1 lần ExecuteAsync thay vì vòng lặp vô hạn
        /// </summary>
        private async System.Threading.Tasks.Task RunOnceAsync(AppointmentCleanupService service)
        {
            using var cts = new CancellationTokenSource();
            // Cancel sau khi xử lý vòng đầu tiên để dừng loop
            cts.CancelAfter(TimeSpan.FromMilliseconds(100));
            await service.StartAsync(cts.Token);
            await service.StopAsync(cts.Token);
        }

        [Fact(DisplayName = "UTCID01 - No appointments, no update or notification")]
        public async System.Threading.Tasks.Task UTCID01_NoAppointments_NoAction()
        {
            // Arrange
            _appointmentRepoMock.Setup(r => r.GetAllCofirmAppoitmentAsync())
                .ReturnsAsync(new List<Appointment>());

            var serviceProvider = BuildServiceProvider();

            var service = new AppointmentCleanupService(
                serviceProvider,
                _mediatorMock.Object
            );

            // Act
            await RunOnceAsync(service);

            // Assert
            _appointmentRepoMock.Verify(r => r.UpdateAppointmentAsync(It.IsAny<Appointment>()), Times.Never);
            _mediatorMock.Verify(m => m.Send(It.IsAny<SendNotificationCommand>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact(DisplayName = "UTCID02 - Appointment expired should update and send notifications")]
        public async System.Threading.Tasks.Task UTCID02_ExpiredAppointment_UpdatesAndSendsNotifications()
        {
            // Arrange
            var expiredAppointment = new Appointment
            {
                AppointmentId = 1,
                AppointmentDate = DateTime.Now.AddDays(-2),
                Status = "confirmed",
                DentistId = 1,
                PatientId = 2
            };

            _appointmentRepoMock.Setup(r => r.GetAllCofirmAppoitmentAsync())
                .ReturnsAsync(new List<Appointment> { expiredAppointment });
            _appointmentRepoMock.Setup(r => r.UpdateAppointmentAsync(It.IsAny<Appointment>()))
                .ReturnsAsync(true);

            _dentistRepoMock.Setup(r => r.GetDentistByDentistIdAsync(It.IsAny<int>()))
                .ReturnsAsync(new Dentist { User = new User { UserID = 10, Fullname = "Dentist A" } });
            _patientRepoMock.Setup(r => r.GetPatientByPatientIdAsync(It.IsAny<int>()))
                .ReturnsAsync(new Patient { User = new User { UserID = 20, Fullname = "Patient B" } });
            _userCommonRepoMock.Setup(r => r.GetAllReceptionistAsync())
                .ReturnsAsync(new List<Receptionist> { new Receptionist { User = new User { UserID = 30 } } });

            var serviceProvider = BuildServiceProvider();

            var service = new AppointmentCleanupService(
                serviceProvider,
                _mediatorMock.Object
            );

            // Act
            await RunOnceAsync(service);

            // Assert
            _appointmentRepoMock.Verify(r => r.UpdateAppointmentAsync(It.Is<Appointment>(a => a.Status == "absented")), Times.Once);
            _mediatorMock.Verify(m => m.Send(It.IsAny<SendNotificationCommand>(), It.IsAny<CancellationToken>()), Times.AtLeastOnce);
        }

        [Fact(DisplayName = "UTCID03 - Appointment not expired should not update")]
        public async System.Threading.Tasks.Task UTCID03_NotExpiredAppointment_NoUpdate()
        {
            // Arrange
            var notExpiredAppointment = new Appointment
            {
                AppointmentId = 2,
                AppointmentDate = DateTime.Now, // hôm nay -> chưa quá hạn
                Status = "confirmed"
            };

            _appointmentRepoMock.Setup(r => r.GetAllCofirmAppoitmentAsync())
                .ReturnsAsync(new List<Appointment> { notExpiredAppointment });

            var serviceProvider = BuildServiceProvider();

            var service = new AppointmentCleanupService(
                serviceProvider,
                _mediatorMock.Object
            );

            // Act
            await RunOnceAsync(service);

            // Assert
            _appointmentRepoMock.Verify(r => r.UpdateAppointmentAsync(It.IsAny<Appointment>()), Times.Never);
            _mediatorMock.Verify(m => m.Send(It.IsAny<SendNotificationCommand>(), It.IsAny<CancellationToken>()), Times.Never);
        }
    }
}
