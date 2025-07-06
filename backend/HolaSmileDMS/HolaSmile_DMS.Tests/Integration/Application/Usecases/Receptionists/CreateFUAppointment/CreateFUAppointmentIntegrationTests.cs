using System.Security.Claims;
using Application.Constants;
using Application.Usecases.Receptionist.CreateFUAppointment;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Receptionists.CreateFUAppointment
{
    public class CreateFUAppointmentIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly CreateFUAppointmentHandle _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CreateFUAppointmentIntegrationTests()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("TestDb_CreateFUAppointment"));

            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            SeedData();

            _handler = new CreateFUAppointmentHandle(
                new AppointmentRepository(_context),
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
                new User { UserID = 1001, Username = "reception1", Phone = "0900111111" },
                new User { UserID = 2001, Username = "patient1", Phone = "0900222222" },
                new User { UserID = 3001, Username = "dentist1", Phone = "0900333333" }
            );

            _context.Patients.Add(new Patient { PatientID = 201, UserID = 2001 });
            _context.Dentists.Add(new global::Dentist { DentistId = 301, UserId = 3001 });

            _context.Appointments.Add(new Appointment
            {
                AppointmentId = 1,
                PatientId = 201,
                DentistId = 301,
                Status = "cancelled",
                AppointmentType = "initial",
                CreatedAt = DateTime.Now.AddDays(-5)
            });

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

        [Fact(DisplayName = "[Integration - Normal] Receptionist Creates Follow-Up Appointment Successfully")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task N_Receptionist_Creates_FollowUp_Successfully()
        {
            SetupHttpContext("receptionist", 1001);

            var command = new CreateFUAppointmentCommand
            {
                PatientId = 201,
                DentistId = 301,
                AppointmentDate = DateTime.Today.AddDays(1),
                AppointmentTime = new TimeSpan(10, 0, 0),
                ReasonForFollowUp = "Follow-up cleaning"
            };

            var result = await _handler.Handle(command, default);
            Assert.Equal(MessageConstants.MSG.MSG05, result);
        }

        [Fact(DisplayName = "[Integration - Abnormal] Appointment Date in Past Throws Error")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_PastDate_Throws_Exception()
        {
            SetupHttpContext("receptionist", 1001);

            var command = new CreateFUAppointmentCommand
            {
                PatientId = 201,
                DentistId = 301,
                AppointmentDate = DateTime.Today.AddDays(-1),
                AppointmentTime = new TimeSpan(10, 0, 0),
                ReasonForFollowUp = "Late visit"
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG34, ex.Message);
        }

        [Fact(DisplayName = "[Integration - Abnormal] Non-Receptionist Cannot Create Appointment")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_NonReceptionist_Throws_Unauthorized()
        {
            SetupHttpContext("dentist", 3001);

            var command = new CreateFUAppointmentCommand
            {
                PatientId = 201,
                DentistId = 301,
                AppointmentDate = DateTime.Today.AddDays(1),
                AppointmentTime = new TimeSpan(10, 0, 0),
                ReasonForFollowUp = "Routine"
            };

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
        }

        [Fact(DisplayName = "[Integration - Abnormal] Patient Has Confirmed Appointment")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_Confirmed_Appointment_Throws_Error()
        {
            SetupHttpContext("receptionist", 1001);

            // Update seed to have confirmed status
            var lastAppointment = _context.Appointments.First();
            lastAppointment.Status = "confirmed";
            _context.SaveChanges();

            var command = new CreateFUAppointmentCommand
            {
                PatientId = 201,
                DentistId = 301,
                AppointmentDate = DateTime.Today.AddDays(2),
                AppointmentTime = new TimeSpan(14, 0, 0),
                ReasonForFollowUp = "Already confirmed"
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG89, ex.Message);
        }
    }
}
