using System.Security.Claims;
using Application.Constants;
using Application.Usecases.Patients.CancelAppointment;
using HDMS_API.Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Infrastructure.Repositories;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Patients
{
    public class CancelAppointmentIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly Mock<IMediator> _mediator = new();

        private readonly CancelAppointmentHandle _handler;

        public CancelAppointmentIntegrationTests()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("EditProfileTestDb"));

            services.AddMemoryCache();
            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();

            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();
            var memoryCache = provider.GetRequiredService<IMemoryCache>();

            SeedData();


            SeedData();

            _handler = new CancelAppointmentHandle(
                new AppointmentRepository(_context),
            _httpContextAccessor,
            new DentistRepository(_context),
                new UserCommonRepository(_context, new Mock<IEmailService>().Object, memoryCache),
                _mediator.Object
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
                new User { UserID = 10, Username = "patient1", Phone = "0123456789" },
                new User { UserID = 20, Username = "dentist1", Phone = "0123456780" },
                new User { UserID = 30, Username = "receptionist1", Phone = "0123456789" }
            );

            _context.Patients.Add(new Patient { PatientID = 1, UserID = 10 });
            _context.Dentists.Add(new global::Dentist { DentistId = 2, UserId = 20 });

            _context.Appointments.AddRange(new Appointment
            {
                AppointmentId = 99,
                PatientId = 1,
                DentistId = 2,
                AppointmentDate = DateTime.Today,
                AppointmentTime = new TimeSpan(10, 0, 0),
                Status = "confirmed",
                CreatedAt = DateTime.Now
            },
            new Appointment
            {
                AppointmentId = 98,
                PatientId = 1,
                DentistId = 2,
                AppointmentDate = DateTime.Today,
                AppointmentTime = new TimeSpan(10, 0, 0),
                Status = "canceled",
                CreatedAt = DateTime.Now
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

        [Fact(DisplayName = "[Integration - Normal] Patient cancels confirmed appointment → return MSG06")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task N_CancelConfirmedAppointment_ReturnMSG06()
        {
            SetupHttpContext("Patient", 10);
            var result = await _handler.Handle(new CancelAppointmentCommand(99), default);
            Assert.Equal(MessageConstants.MSG.MSG06, result);
        }

        [Fact(DisplayName = "[Integration - Abnormal] Unauthorized user → throw MSG26")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_UnauthorizedUser_ThrowsMSG26()
        {
            SetupHttpContext("Dentist", 20);
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new CancelAppointmentCommand(99), default));
        }

        [Fact(DisplayName = "[Integration - Abnormal] Appointment not found → throw MSG28")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_AppointmentNotFound_ThrowsMSG28()
        {
            SetupHttpContext("Patient", 10);
            await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(new CancelAppointmentCommand(999), default));
        }

        [Fact(DisplayName = "[Integration - Abnormal] Appointment not confirmed → throw exception")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_AppointmentNotConfirmed_ThrowsException()
        {
            // Set appointment status to something else
            var app = _context.Appointments.First(a => a.AppointmentId == 98);
            app.AppointmentDate = DateTime.Now;
            _context.SaveChanges();

            SetupHttpContext("Patient", 10);
            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(new CancelAppointmentCommand(98), default));

            Assert.Equal("Bạn chỉ có thể hủy lịch ở trạng thái xác nhận", ex.Message);
        }
    }

}
