using Application.Constants;
using Application.Usecases.Assistant.CreateWarrantyCard;
using AutoMapper;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Hubs;
using Infrastructure.Repositories;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistant
{
    public class CreateWarrantyCardIntegrationTest
    {
        private readonly ApplicationDbContext _context;
        private readonly CreateWarrantyCardHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CreateWarrantyCardIntegrationTest()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("CreateWarrantyCardTestDb"));

            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();

            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            // ✅ Mocks cần thiết
            var mockMapper = new Mock<IMapper>().Object;
            var mockHubContext = new Mock<IHubContext<NotifyHub>>().Object;

            var warrantyRepo = new WarrantyCardRepository(_context);
            var procedureRepo = new ProcedureRepository(_context);
            var treatmentRecordRepo = new TreatmentRecordRepository(_context, mockMapper);
            var notificationRepo = new NotificationsRepository(_context, mockHubContext, mockMapper);
            var mediator = new Mock<IMediator>().Object;

            _handler = new CreateWarrantyCardHandler(
                warrantyRepo,
                procedureRepo,
                treatmentRecordRepo,
                _httpContextAccessor,
                notificationRepo,
                mediator
            );

            SeedData();
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

        private void SeedData()
        {
            _context.WarrantyCards.RemoveRange(_context.WarrantyCards);
            _context.TreatmentRecords.RemoveRange(_context.TreatmentRecords);
            _context.Procedures.RemoveRange(_context.Procedures);
            _context.Appointments.RemoveRange(_context.Appointments);
            _context.Users.RemoveRange(_context.Users);
            _context.SaveChanges();

            var patient = new User
            {
                UserID = 2,
                Username = "patient01",
                Phone = "0123456789" 
            };

            var appointment = new Appointment
            {
                AppointmentId = 1,
                PatientId = 1
            };

            var procedure = new Procedure
            {
                ProcedureId = 1,
                ProcedureName = "Trám răng",
                WarrantyCardId = null
            };

            var record = new TreatmentRecord
            {
                TreatmentRecordID = 1,
                ProcedureID = 1,
                TreatmentStatus = "Completed",
                AppointmentID = 1
            };

            _context.Users.Add(patient);
            _context.Appointments.Add(appointment);
            _context.Procedures.Add(procedure);
            _context.TreatmentRecords.Add(record);
            _context.SaveChanges();
        }

        [Fact(DisplayName = "Normal - UTCID01 - Assistant creates warranty card successfully")]
        public async System.Threading.Tasks.Task UTCID01_CreateWarrantyCard_Success()
        {
            SetupHttpContext("Assistant", "1");

            var command = new CreateWarrantyCardCommand
            {
                ProcedureId = 1,
                Term = "6 tháng"
            };

            var result = await _handler.Handle(command, default);

            Assert.NotNull(result);
            Assert.Equal("6 tháng", result.Term);
            Assert.True(result.Status);
            Assert.True(result.WarrantyCardId > 0);
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - Not logged in should throw MSG53")]
        public async System.Threading.Tasks.Task UTCID02_CreateWarrantyCard_NoLogin_Throws()
        {
            _httpContextAccessor.HttpContext = null;

            var command = new CreateWarrantyCardCommand
            {
                ProcedureId = 1,
                Term = "6 tháng"
            };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Not assistant should throw MSG26")]
        public async System.Threading.Tasks.Task UTCID03_CreateWarrantyCard_NotAssistant_Throws()
        {
            SetupHttpContext("Dentist");

            var command = new CreateWarrantyCardCommand
            {
                ProcedureId = 1,
                Term = "6 tháng"
            };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID04 - Invalid ProcedureId should throw MSG99")]
        public async System.Threading.Tasks.Task UTCID04_CreateWarrantyCard_InvalidProcedure_Throws()
        {
            SetupHttpContext("Assistant");

            var command = new CreateWarrantyCardCommand
            {
                ProcedureId = 999,
                Term = "6 tháng"
            };

            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG99, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID05 - Procedure already has card should throw MSG100")]
        public async System.Threading.Tasks.Task UTCID05_CreateWarrantyCard_AlreadyExists_Throws()
        {
            SetupHttpContext("Assistant");

            var card = new WarrantyCard
            {
                WarrantyCardID = 999,
                StartDate = DateTime.Now,
                EndDate = DateTime.Now.AddMonths(6),
                Term = "6 tháng",
                Status = true
            };

            _context.WarrantyCards.Add(card);

            var procedure = _context.Procedures.First(p => p.ProcedureId == 1);
            procedure.WarrantyCardId = 999;

            _context.SaveChanges();

            var command = new CreateWarrantyCardCommand
            {
                ProcedureId = 1,
                Term = "6 tháng"
            };

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG100, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID06 - Treatment not completed should throw MSG101")]
        public async System.Threading.Tasks.Task UTCID06_CreateWarrantyCard_NotCompletedTreatment_Throws()
        {
            SetupHttpContext("Assistant");

            var procedure = new Procedure
            {
                ProcedureId = 2,
                ProcedureName = "Tẩy trắng"
            };

            var record = new TreatmentRecord
            {
                TreatmentRecordID = 2,
                ProcedureID = 2,
                TreatmentStatus = "in progress",
                AppointmentID = 1
            };

            _context.Procedures.Add(procedure);
            _context.TreatmentRecords.Add(record);
            _context.SaveChanges();

            var command = new CreateWarrantyCardCommand
            {
                ProcedureId = 2,
                Term = "6 tháng"
            };

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG101, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID07 - Invalid term format should throw MSG97")]
        public async System.Threading.Tasks.Task UTCID07_CreateWarrantyCard_InvalidTerm_Throws()
        {
            SetupHttpContext("Assistant");

            var command = new CreateWarrantyCardCommand
            {
                ProcedureId = 1,
                Term = "abc" // Invalid
            };

            var ex = await Assert.ThrowsAsync<FormatException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG98, ex.Message);
        }
    }
}
