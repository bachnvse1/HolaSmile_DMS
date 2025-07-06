using System.Security.Claims;
using Application.Common.Mappings;
using Application.Constants;
using Application.Usecases.UserCommon.ViewAppointment;
using AutoMapper;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.UserCommon
{
    public class ViewAppointmentIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly ViewAppointmentHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ViewAppointmentIntegrationTests()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("TestDb_ViewAppointments"));

            services.AddAutoMapper(typeof(MappingAppointment).Assembly);
            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();
            var mapper = provider.GetRequiredService<IMapper>();

            SeedData();

            _handler = new ViewAppointmentHandler(
                new AppointmentRepository(_context),
                _httpContextAccessor,
                mapper
            );
        }

        private void SeedData()
        {
            // Xóa dữ liệu cũ
            _context.Users.RemoveRange(_context.Users);
            _context.Patients.RemoveRange(_context.Patients);
            _context.Dentists.RemoveRange(_context.Dentists);
            _context.Appointments.RemoveRange(_context.Appointments);
            _context.SaveChanges();

            // Tạo User (KHÔNG CÓ TRƯỜNG ROLE)
            var user101 = new User { UserID = 101, Username = "patient1", Phone = "0911111111" };
            var user102 = new User { UserID = 102, Username = "patient2", Phone = "0911111112" };
            var user201 = new User { UserID = 201, Username = "dentist1", Phone = "0922222222" };
            var user301 = new User { UserID = 301, Username = "receptionist1", Phone = "0933333333" };
            var user999 = new User { UserID = 999, Username = "emptyuser", Phone = "0944444444" };

            _context.Users.AddRange(user101, user102, user201, user301, user999);

            // Mapping Patient ↔ User
            var patient1 = new Patient { PatientID = 201, UserID = 101, User = user101 };
            var patient2 = new Patient { PatientID = 202, UserID = 102, User = user102 };

            // Mapping Dentist ↔ User
            var dentist = new global::Dentist { DentistId = 301, UserId = 201, User = user201 };

            _context.Patients.AddRange(patient1, patient2);
            _context.Dentists.Add(dentist);

            // Tạo lịch hẹn với dentist & patient
            _context.Appointments.AddRange(
                new Appointment
                {
                    AppointmentId = 1,
                    PatientId = patient1.PatientID,
                    DentistId = dentist.DentistId,
                    AppointmentDate = DateTime.Today.AddDays(1),
                    AppointmentTime = new TimeSpan(9, 0, 0),
                    Status = "confirmed"
                },
                new Appointment
                {
                    AppointmentId = 2,
                    PatientId = patient1.PatientID,
                    DentistId = dentist.DentistId,
                    AppointmentDate = DateTime.Today.AddDays(2),
                    AppointmentTime = new TimeSpan(10, 0, 0),
                    Status = "confirmed"
                },
                new Appointment
                {
                    AppointmentId = 3,
                    PatientId = patient2.PatientID,
                    DentistId = dentist.DentistId,
                    AppointmentDate = DateTime.Today.AddDays(3),
                    AppointmentTime = new TimeSpan(11, 0, 0),
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

        [Fact(DisplayName = "[ITCID01] Patient can view own appointments")]
        public async System.Threading.Tasks.Task ITCID01_Patient_View_Own_Appointments()
        {
            SetupHttpContext("patient", 101);
            var result = await _handler.Handle(new ViewAppointmentCommand(), default);
            Assert.Equal(2, result.Count);
        }

        [Fact(DisplayName = "[ITCID02] Dentist can view own appointments")]
        public async System.Threading.Tasks.Task ITCID02_Dentist_View_Own_Appointments()
        {
            SetupHttpContext("dentist", 201);
            var result = await _handler.Handle(new ViewAppointmentCommand(), default);
            Assert.Equal(3, result.Count); // dentistId = 201 in all 3
        }

        [Fact(DisplayName = "[ITCID03] Receptionist can view all appointments")]
        public async System.Threading.Tasks.Task ITCID03_Receptionist_View_All_Appointments()
        {
            SetupHttpContext("receptionist", 301);
            var result = await _handler.Handle(new ViewAppointmentCommand(), default);
            Assert.Equal(3, result.Count);
        }

        [Fact(DisplayName = "[ITCID04] Patient has no appointments")]
        public async System.Threading.Tasks.Task ITCID04_Patient_Has_No_Appointments()
        {
            SetupHttpContext("patient", 999);
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(new ViewAppointmentCommand(), default));
            Assert.Equal(MessageConstants.MSG.MSG28, ex.Message);
        }
    }
}
