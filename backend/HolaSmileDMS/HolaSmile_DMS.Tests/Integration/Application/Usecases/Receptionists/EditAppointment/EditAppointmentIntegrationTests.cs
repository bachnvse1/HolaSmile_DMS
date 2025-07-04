using System.Security.Claims;
using Application.Usecases.Receptionist.EditAppointment;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Infrastructure.Repositories;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Receptionists.EditAppointment
{
    public class EditAppointmentIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly EditAppointmentHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public EditAppointmentIntegrationTests()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("TestDb_EditAppointment"));

            services.AddHttpContextAccessor();

            var mockMediator = new Mock<IMediator>();

            var provider = services.BuildServiceProvider();

            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            SeedData();

            _handler = new EditAppointmentHandler(
                new AppointmentRepository(_context),
                mockMediator.Object,
                _httpContextAccessor,
                new PatientRepository(_context),
                new DentistRepository(_context)
            );
        }

        private void SeedData()
        {
            _context.Users.RemoveRange(_context.Users);
            _context.Patients.RemoveRange(_context.Patients);
            _context.Dentists.RemoveRange(_context.Dentists);
            _context.Appointments.RemoveRange(_context.Appointments);
            _context.SaveChanges();

            _context.Users.AddRange(
                new User { UserID = 101, Username = "patient1", Phone = "0911111111" },
                new User { UserID = 201, Username = "dentist1", Phone = "0922222222" },
                new User { UserID = 202, Username = "dentist2", Phone = "0922222223" },
                new User { UserID = 301, Username = "receptionist1", Phone = "0933333333" }
            );

            _context.Patients.Add(new Patient { PatientID = 101, UserID = 101 });

            _context.Dentists.AddRange(
                new global::Dentist { DentistId = 201, UserId = 201 },
                new global::Dentist { DentistId = 202, UserId = 202 }
            );

            _context.Appointments.AddRange(
                new Appointment
                {
                    AppointmentId = 1,
                    PatientId = 101,
                    DentistId = 201,
                    AppointmentDate = DateTime.Today.AddDays(1),
                    AppointmentTime = new TimeSpan(9, 0, 0),
                    Status = "confirmed"
                },
                new Appointment
                {
                    AppointmentId = 2,
                    PatientId = 101,
                    DentistId = 201,
                    AppointmentDate = DateTime.Today.AddDays(1),
                    AppointmentTime = new TimeSpan(9, 0, 0),
                    Status = "confirmed"
                }
            );

            _context.SaveChanges();
        }

        private void SetupHttpContext(string role, int userId)
        {
            var context = new DefaultHttpContext();
            context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        }, "Test"));

            _httpContextAccessor.HttpContext = context;
        }

        [Fact(DisplayName = "[Integration - Normal] ITCID01 - Receptionist edits appointment successfully")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task ITCID01_EditAppointment_Success()
        {
            SetupHttpContext("receptionist", 301);

            var result = await _handler.Handle(new EditAppointmentCommand
            {
                appointmentId = 1,
                DentistId = 202,
                AppointmentDate = DateTime.Today.AddDays(1),
                AppointmentTime = new TimeSpan(10, 0, 0),
                ReasonForFollowUp = "Update schedule"
            }, default);

            Assert.True(result);
        }

        [Fact(DisplayName = "[Integration - Abnormal] ITCID02 - Unauthorized role cannot edit")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task ITCID02_EditAppointment_Unauthorized()
        {
            SetupHttpContext("dentist", 201);

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(new EditAppointmentCommand
            {
                appointmentId = 1,
                DentistId = 202,
                AppointmentDate = DateTime.Today.AddDays(2),
                AppointmentTime = new TimeSpan(10, 0, 0),
                ReasonForFollowUp = "Should fail"
            }, default));
        }

        [Fact(DisplayName = "[Integration - Abnormal] ITCID03 - Appointment not found")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task ITCID03_EditAppointment_NotFound()
        {
            SetupHttpContext("receptionist", 301);

            await Assert.ThrowsAsync<Exception>(() => _handler.Handle(new EditAppointmentCommand
            {
                appointmentId = 999,
                DentistId = 202,
                AppointmentDate = DateTime.Today.AddDays(2),
                AppointmentTime = new TimeSpan(10, 0, 0),
                ReasonForFollowUp = "Invalid"
            }, default));
        }

        [Fact(DisplayName = "[Integration - Abnormal] ITCID04 - Invalid appointment date")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task ITCID04_EditAppointment_InvalidDate()
        {
            SetupHttpContext("receptionist", 301);

            await Assert.ThrowsAsync<Exception>(() => _handler.Handle(new EditAppointmentCommand
            {
                appointmentId = 2,
                DentistId = 202,
                AppointmentDate = DateTime.Today.AddDays(-1),
                AppointmentTime = new TimeSpan(10, 0, 0),
                ReasonForFollowUp = "Too late"
            }, default));
        }

        [Fact(DisplayName = "[Integration - Abnormal] ITCID05 - Dentist not found")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task ITCID05_EditAppointment_DentistNotFound()
        {
            SetupHttpContext("receptionist", 301);

            await Assert.ThrowsAsync<Exception>(() => _handler.Handle(new EditAppointmentCommand
            {
                appointmentId = 2,
                DentistId = 999,
                AppointmentDate = DateTime.Today.AddDays(2),
                AppointmentTime = new TimeSpan(10, 0, 0),
                ReasonForFollowUp = "No such dentist"
            }, default));
        }
    }
}
