using System.Security.Claims;
using Application.Usecases.UserCommon.ViewPatientPrescription;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.UserCommon
{
    public class ViewPatientPrescriptionHandlerIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly ViewPatientPrescriptionHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ViewPatientPrescriptionHandlerIntegrationTests()
        {
            var services = new ServiceCollection();
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("TestDb_ViewPatientPrescription"));
            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            SeedData();

            _handler = new ViewPatientPrescriptionHandler(
                _httpContextAccessor,
                new PatientRepository(_context),
                new PrescriptionRepository(_context),
                new DentistRepository(_context)
            );
        }

        private void SeedData()
        {
            _context.Users.RemoveRange(_context.Users);
            _context.Patients.RemoveRange(_context.Patients);
            _context.Dentists.RemoveRange(_context.Dentists);
            _context.Appointments.RemoveRange(_context.Appointments);
            _context.Prescriptions.RemoveRange(_context.Prescriptions);
            _context.SaveChanges();

            var patientUser = new User
            {
                UserID = 2001,
                Username = "0123456789",
                Phone = "0123456789",
                Fullname = "Nguyen Van A",
                Email = "patient@email.com",
                Status = true
            };
            var dentistUser = new User
            {
                UserID = 2002,
                Username = "0999999999",
                Phone = "0999999999",
                Fullname = "Dr. B",
                Email = "dentist@email.com",
                Status = true
            };
            _context.Users.AddRange(patientUser, dentistUser);
            _context.SaveChanges();

            _context.Patients.Add(new Patient
            {
                PatientID = 3001,
                UserID = 2001
            });
            _context.Dentists.Add(new Dentist
            {
                DentistId = 4001,
                UserId = 2002
            });
            _context.SaveChanges();

            var appointment = new Appointment
            {
                AppointmentId = 5001,
                PatientId = 3001,
                DentistId = 4001
            };
            _context.Appointments.Add(appointment);
            _context.SaveChanges();

            _context.Prescriptions.Add(new Prescription
            {
                PrescriptionId = 6001,
                AppointmentId = 5001,
                Content = "Take 2 pills daily",
                CreatedAt = DateTime.Now,
                CreateBy = 2002
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

        [Fact(DisplayName = "[Integration - Normal] Patient views their prescription successfully")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task N_Patient_View_Prescription_Success()
        {
            SetupHttpContext("patient", 2001);

            var command = new ViewPatientPrescriptionCommand(6001);

            var result = await _handler.Handle(command, default);

            Assert.NotNull(result);
            Assert.Equal(6001, result.PrescriptionId);
            Assert.Equal("Take 2 pills daily", result.content);
            Assert.Equal("Dr. B", result.CreatedBy);
        }

        [Fact(DisplayName = "[Integration - Abnormal] Patient tries to view other's prescription")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_Patient_View_Other_Prescription_Unauthorized()
        {
            // Tạo 1 user không liên quan đến Prescription
            _context.Users.Add(new User
            {
                UserID = 9999,
                Username = "unauth",
                Phone = "0999999999",
                Fullname = "Hacker",
                Email = "hacker@email.com",
                Status = true
            });
            _context.Patients.Add(new Patient
            {
                PatientID = 9998,
                UserID = 9999
            });
            _context.SaveChanges();

            SetupHttpContext("patient", 9999);

            var command = new ViewPatientPrescriptionCommand(6001);

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
        }

        [Fact(DisplayName = "[Integration - Abnormal] Prescription does not exist")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_View_Non_Existent_Prescription()
        {
            SetupHttpContext("patient", 2001);

            var command = new ViewPatientPrescriptionCommand(9999);

            await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        }
    }
}
