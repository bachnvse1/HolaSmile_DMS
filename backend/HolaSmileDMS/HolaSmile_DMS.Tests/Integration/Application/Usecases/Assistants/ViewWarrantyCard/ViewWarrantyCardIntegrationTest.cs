using Application.Constants;
using Application.Usecases.Assistant.ViewListWarrantyCards;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using Xunit;
using Infrastructure.Repositories;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants
{
    public class ViewWarrantyCardIntegrationTest
    {
        private readonly ApplicationDbContext _context;
        private readonly ViewListWarrantyCardsHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ViewWarrantyCardIntegrationTest()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase($"ViewWarrantyCardTestDb_{Guid.NewGuid()}")); // tách DB theo test run

            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();

            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            _handler = new ViewListWarrantyCardsHandler(
                new WarrantyCardRepository(_context),
                _httpContextAccessor
            );
        }

        private void ClearData()
        {
            // Xoá theo thứ tự tránh FK
            _context.WarrantyCards.RemoveRange(_context.WarrantyCards);
            _context.TreatmentRecords.RemoveRange(_context.TreatmentRecords);
            _context.Appointments.RemoveRange(_context.Appointments);
            _context.Procedures.RemoveRange(_context.Procedures);
            _context.Patients.RemoveRange(_context.Patients);
            _context.Users.RemoveRange(_context.Users);
            _context.SaveChanges();
        }

        private void SetupHttpContext(string role, string userId = "1")
        {
            var context = new DefaultHttpContext();
            context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Role, role)
            }, "TestAuth"));

            _httpContextAccessor.HttpContext = context;
        }

        private (WarrantyCard card, TreatmentRecord tr) SeedCardWithProcedure()
        {
            var user = new User
            {
                UserID = 1,
                Fullname = "Patient F",
                Username = "patientf",
                Phone = "0900000001",
                Email = "patientf@example.com" 
            };
            var patient = new Patient { PatientID = 10, User = user };

            var procedure = new Procedure { ProcedureId = 1, ProcedureName = "Nhổ răng" };

            var appointment = new Appointment
            {
                AppointmentId = 100,
                Patient = patient,
                AppointmentDate = new DateTime(2025, 6, 1),
                AppointmentTime = new TimeSpan(8, 0, 0)
            };

            var tr = new TreatmentRecord
            {
                TreatmentRecordID = 1000,
                Procedure = procedure,
                Appointment = appointment
            };

            var card = new WarrantyCard
            {
                WarrantyCardID = 1,
                StartDate = new DateTime(2025, 6, 1),
                EndDate = new DateTime(2025, 12, 1),
                Duration = 6,
                Status = true,
                TreatmentRecord = tr
            };

            _context.Users.Add(user);
            _context.Patients.Add(patient);
            _context.Procedures.Add(procedure);
            _context.Appointments.Add(appointment);
            _context.TreatmentRecords.Add(tr);
            _context.WarrantyCards.Add(card);
            _context.SaveChanges();

            return (card, tr);
        }

        private (WarrantyCard card, TreatmentRecord tr) SeedCardWithoutProcedure()
        {
            var user = new User
            {
                UserID = 2,
                Fullname = "Patient G",
                Username = "patientg",
                Phone = "0900000002",
                Email = "patientg@example.com"
            };
            var patient = new Patient { PatientID = 11, User = user };

            var appointment = new Appointment
            {
                AppointmentId = 101,
                Patient = patient,
                AppointmentDate = new DateTime(2025, 1, 2),
                AppointmentTime = new TimeSpan(9, 0, 0)
            };

            var tr = new TreatmentRecord
            {
                TreatmentRecordID = 1001,
                Procedure = null,
                Appointment = appointment
            };

            var card = new WarrantyCard
            {
                WarrantyCardID = 2,
                StartDate = new DateTime(2025, 1, 1),
                EndDate = new DateTime(2025, 12, 1),
                Duration = 12,
                Status = true,
                TreatmentRecord = tr
            };

            _context.Users.Add(user);
            _context.Patients.Add(patient);
            _context.Appointments.Add(appointment);
            _context.TreatmentRecords.Add(tr);
            _context.WarrantyCards.Add(card);
            _context.SaveChanges();

            return (card, tr);
        }

        [Fact(DisplayName = "Normal - UTCID01 - Assistant views warranty cards successfully")]
        public async System.Threading.Tasks.Task UTCID01_Assistant_ViewWarrantyCards_Success()
        {
            ClearData();
            SeedCardWithProcedure();

            SetupHttpContext("Assistant");
            var command = new ViewListWarrantyCardsCommand();

            var result = await _handler.Handle(command, default);

            Assert.Single(result);
            var card = result.First();
            Assert.Equal("Nhổ răng", card.ProcedureName);
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - Unauthorized when not logged in")]
        public async System.Threading.Tasks.Task UTCID02_ViewWarrantyCards_NoHttpContext_Throws()
        {
            _httpContextAccessor.HttpContext = null;
            var command = new ViewListWarrantyCardsCommand();

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Unauthorized when role is not allowed")]
        public async System.Threading.Tasks.Task UTCID03_ViewWarrantyCards_InvalidRole_Throws()
        {
            // Handler cho phép: Assistant, Dentist, Receptionist, Patient
            // Chọn role KHÔNG hợp lệ để đúng với điều kiện ném MSG26:
            SetupHttpContext("Owner");
            var command = new ViewListWarrantyCardsCommand();

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "Normal - UTCID04 - Assistant views empty list when no data")]
        public async System.Threading.Tasks.Task UTCID04_ViewWarrantyCards_NoData_ReturnsEmptyList()
        {
            ClearData();

            SetupHttpContext("Assistant");
            var command = new ViewListWarrantyCardsCommand();

            var result = await _handler.Handle(command, default);

            Assert.NotNull(result);
            Assert.Empty(result);
        }
    }
}
