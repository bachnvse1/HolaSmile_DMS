using System.Security.Claims;
using Application.Constants;
using Application.Usecases.Dentists.CreatePrescription;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Infrastructure.Repositories;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Dentists
{
    public class CreatePrescriptionHandlerIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly CreatePrescriptionHandler _handler;

        public CreatePrescriptionHandlerIntegrationTests()
        {
            var services = new ServiceCollection();
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("TestDb_CreatePrescription"));

            services.AddHttpContextAccessor();
            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            SeedData();

            _handler = new CreatePrescriptionHandler(
                _httpContextAccessor,
                new PrescriptionRepository(_context),
                new AppointmentRepository(_context),
                new PatientRepository(_context),
                new Mock<IMediator>().Object
            );
        }

        private void SeedData()
        {
            _context.Users.RemoveRange(_context.Users);
            _context.Appointments.RemoveRange(_context.Appointments);
            _context.Patients.RemoveRange(_context.Patients);
            _context.Dentists.RemoveRange(_context.Dentists);
            _context.Prescriptions.RemoveRange(_context.Prescriptions);
            _context.SaveChanges();

            _context.Users.AddRange(
        new User
        {
            UserID = 2001,
            Username = "0123456789",
            Phone = "0123456789",
            Fullname = "Dr. A",
        },
        new User
        {
            UserID = 9999,
            Username = "assistant",
            Phone = "0999999999",
            Fullname = "Assistant User",
        },
        new User
        {
            UserID = 3001,
            Username = "patient1",
            Phone = "0888888888",
            Fullname = "Patient One",
        }
         );

            _context.Patients.Add(new Patient
            { 
                UserID = 2001,
                PatientID = 4001
            });

            _context.Dentists.Add(new Dentist
            {
                UserId = 3001,
                DentistId = 2001
            });

            _context.Appointments.Add(new Appointment
            {
                AppointmentId = 3001,
                PatientId = 4001,
                DentistId = 2001,
                AppointmentDate = DateTime.Now,
                AppointmentTime = new TimeSpan(10, 0, 0), // 10:00 AM
                IsNewPatient = true,
                Content = "Initial consultation",
                CreatedAt = DateTime.Now,
                Status = "attended"
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
            }, "TestAuth"));
            _httpContextAccessor.HttpContext = context;
        }

        [Fact(DisplayName = "[ITCID01] Dentist creates prescription successfully")]
        public async System.Threading.Tasks.Task ITCID01_Dentist_Creates_Prescription_Success()
        {
            SetupHttpContext("dentist", 2001);

            var command = new CreatePrescriptionCommand
            {
                AppointmentId = 3001,
                contents = "Take 2 pills daily after meal."
            };

            var result = await _handler.Handle(command, default);

            Assert.True(result);
            var created = _context.Prescriptions.FirstOrDefault(p => p.AppointmentId == 3001);
            Assert.NotNull(created);
            Assert.Equal("Take 2 pills daily after meal.", created.Content);
            Assert.Equal(2001, created.CreateBy);
        }

        [Fact(DisplayName = "[ITCID02] Non-dentist tries to create prescription")]
        public async System.Threading.Tasks.Task ITCID02_Non_Dentist_Cannot_Create()
        {
            SetupHttpContext("assistant", 9999);

            var command = new CreatePrescriptionCommand
            {
                AppointmentId = 3001,
                contents = "Invalid action"
            };

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
        }

        [Fact(DisplayName = "[ITCID03] Empty content should throw exception")]
        public async System.Threading.Tasks.Task ITCID03_Empty_Content_Throws()
        {
            SetupHttpContext("dentist", 2001);

            var command = new CreatePrescriptionCommand
            {
                AppointmentId = 3001,
                contents = "   " // empty content
            };

            await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        }

        [Fact(DisplayName = "[ITCID04] Duplicate prescription should fail")]
        public async System.Threading.Tasks.Task ITCID04_Duplicate_Prescription_Throws()
        {
            SetupHttpContext("dentist", 2001);

            _context.Prescriptions.Add(new Prescription
            {
                AppointmentId = 3001,
                Content = "Already exists",
                CreateBy = 2001,
                CreatedAt = DateTime.Now
            });
            _context.SaveChanges();

            var command = new CreatePrescriptionCommand
            {
                AppointmentId = 3001,
                contents = "New content"
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG108, ex.Message);
        }

        [Fact(DisplayName = "[ITCID05] Invalid appointment should throw")]
        public async System.Threading.Tasks.Task ITCID05_Invalid_Appointment_Throws()
        {
            SetupHttpContext("dentist", 2001);

            var command = new CreatePrescriptionCommand
            {
                AppointmentId = 9999,
                contents = "Some content"
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG28, ex.Message);
        }
    }
}
