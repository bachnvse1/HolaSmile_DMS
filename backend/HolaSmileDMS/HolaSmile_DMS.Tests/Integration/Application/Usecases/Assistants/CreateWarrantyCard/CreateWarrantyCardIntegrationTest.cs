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

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants
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

            var mockMapper = new Mock<IMapper>().Object;
            var mockHubContext = new Mock<IHubContext<NotifyHub>>().Object;

            var warrantyRepo = new WarrantyCardRepository(_context);
            var treatmentRecordRepo = new TreatmentRecordRepository(_context, mockMapper);
            var notificationRepo = new NotificationsRepository(_context, mockHubContext, mockMapper);

            _handler = new CreateWarrantyCardHandler(
                warrantyRepo,
                treatmentRecordRepo,
                _httpContextAccessor,
                notificationRepo
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
            _context.Users.RemoveRange(_context.Users);
            _context.Appointments.RemoveRange(_context.Appointments);
            _context.Procedures.RemoveRange(_context.Procedures);
            _context.TreatmentRecords.RemoveRange(_context.TreatmentRecords);
            _context.WarrantyCards.RemoveRange(_context.WarrantyCards);
            _context.SaveChanges();

            _context.Users.Add(new User { UserID = 2, Username = "patient01", Phone = "0123456789" });

            _context.Appointments.Add(new Appointment { AppointmentId = 1, PatientId = 2 });

            _context.Procedures.Add(new Procedure { ProcedureId = 1, ProcedureName = "Trám răng", WarrantyCardId = null });

            _context.TreatmentRecords.Add(new TreatmentRecord
            {
                TreatmentRecordID = 1,
                ProcedureID = 1,
                AppointmentID = 1,
                TreatmentStatus = "Completed"
            });

            _context.SaveChanges();
        }

        [Fact(DisplayName = "UTCID01 - Assistant creates warranty card successfully")]
        public async System.Threading.Tasks.Task UTCID01_Success()
        {
            SetupHttpContext("Assistant");

            var command = new CreateWarrantyCardCommand
            {
                TreatmentRecordId = 1,
                Duration = 6
            };

            var result = await _handler.Handle(command, default);

            Assert.NotNull(result);
            Assert.True(result.WarrantyCardId > 0);
            Assert.Equal(6, result.Duration);
            Assert.True(result.Status);
        }

        [Fact(DisplayName = "UTCID02 - Not logged in should throw MSG53")]
        public async System.Threading.Tasks.Task UTCID02_NoLogin_Throws()
        {
            _httpContextAccessor.HttpContext = null;

            var command = new CreateWarrantyCardCommand
            {
                TreatmentRecordId = 1,
                Duration = 6
            };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
        }

        [Fact(DisplayName = "UTCID03 - Not assistant should throw MSG26")]
        public async System.Threading.Tasks.Task UTCID03_NotAssistant_Throws()
        {
            SetupHttpContext("Patient");

            var command = new CreateWarrantyCardCommand
            {
                TreatmentRecordId = 1,
                Duration = 6
            };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID04 - Invalid TreatmentRecordId should throw MSG101")]
        public async System.Threading.Tasks.Task UTCID04_InvalidTreatmentRecordId_Throws()
        {
            SetupHttpContext("Assistant");

            var command = new CreateWarrantyCardCommand
            {
                TreatmentRecordId = 999,
                Duration = 6
            };

            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG101, ex.Message);
        }

        [Fact(DisplayName = "UTCID05 - Procedure already has card should throw MSG100")]
        public async System.Threading.Tasks.Task UTCID05_ProcedureAlreadyHasCard_Throws()
        {
            SetupHttpContext("Assistant");

            _context.WarrantyCards.Add(new WarrantyCard
            {
                WarrantyCardID = 10,
                StartDate = DateTime.Now,
                EndDate = DateTime.Now.AddMonths(6),
                Duration = 6,
                Status = true,
                TreatmentRecordID = 1
            });

            var procedure = _context.Procedures.First(p => p.ProcedureId == 1);
            procedure.WarrantyCardId = 10;
            _context.SaveChanges();

            var command = new CreateWarrantyCardCommand
            {
                TreatmentRecordId = 1,
                Duration = 6
            };

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG100, ex.Message);
        }

        [Fact(DisplayName = "UTCID06 - Treatment not completed should throw MSG101")]
        public async System.Threading.Tasks.Task UTCID06_TreatmentNotCompleted_Throws()
        {
            SetupHttpContext("Assistant");

            _context.Procedures.Add(new Procedure
            {
                ProcedureId = 2,
                ProcedureName = "Tẩy trắng"
            });

            _context.TreatmentRecords.Add(new TreatmentRecord
            {
                TreatmentRecordID = 2,
                ProcedureID = 2,
                AppointmentID = 1,
                TreatmentStatus = "In progress"
            });

            _context.SaveChanges();

            var command = new CreateWarrantyCardCommand
            {
                TreatmentRecordId = 2,
                Duration = 6
            };

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG101, ex.Message);
        }

        [Fact(DisplayName = "UTCID07 - Invalid duration should throw MSG98")]
        public async System.Threading.Tasks.Task UTCID07_InvalidDuration_Throws()
        {
            SetupHttpContext("Assistant");

            var command = new CreateWarrantyCardCommand
            {
                TreatmentRecordId = 1,
                Duration = -5
            };

            var ex = await Assert.ThrowsAsync<FormatException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG98, ex.Message);
        }
    }
}
