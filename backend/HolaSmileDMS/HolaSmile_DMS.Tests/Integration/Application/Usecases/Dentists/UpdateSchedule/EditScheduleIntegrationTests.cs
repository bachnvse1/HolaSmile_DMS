using System.Security.Claims;
using Application.Usecases.Dentist.UpdateSchedule;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Dentists.UpdateSchedule
{
    public class EditScheduleIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly EditScheduleHandle _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public EditScheduleIntegrationTests()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase(databaseName: "TestDb_EditSchedule"));

            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            SeedData();

            _handler = new EditScheduleHandle(
                new DentistRepository(_context),
                new ScheduleRepository(_context),
                _httpContextAccessor
            );
        }

        private void SeedData()
        {
            _context.Users.RemoveRange(_context.Users);
            _context.Dentists.RemoveRange(_context.Dentists);
            _context.Schedules.RemoveRange(_context.Schedules);
            _context.SaveChanges();

            _context.Users.Add(new User { UserID = 101, Username = "0911111111", Phone = "0911111111"});

            _context.Dentists.Add(new global::Dentist { DentistId = 201, UserId = 101 });

            _context.Schedules.Add(new Schedule
            {
                ScheduleId = 1,
                DentistId = 201,
                WorkDate = DateTime.Today.AddDays(2),
                Shift = "morning",
                Status = "pending",
                CreatedAt = DateTime.Now,
                CreatedBy = 101,
                IsActive = true
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

        [Fact(DisplayName = "[Integration - Normal] Dentist updates own pending schedule successfully")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task N_Dentist_Updates_Pending_Schedule()
        {
            SetupHttpContext("dentist", 101);

            var result = await _handler.Handle(new EditScheduleCommand
            {
                ScheduleId = 1,
                WorkDate = DateTime.Today.AddDays(3),
                Shift = "afternoon"
            }, default);

            Assert.True(result);
        }

        [Fact(DisplayName = "[Integration - Abnormal] Dentist tries to update approved schedule")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_Dentist_Cannot_Edit_Approved_Schedule()
        {
            var schedule = _context.Schedules.First();
            schedule.Status = "approved";
            _context.SaveChanges();

            SetupHttpContext("dentist", 101);

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(new EditScheduleCommand
            {
                ScheduleId = 1,
                WorkDate = DateTime.Today.AddDays(4),
                Shift = "morning"
            }, default));

            Assert.Equal("Lịch làm việc đã được duyệt, không thể chỉnh sửa.", ex.Message);
        }

        [Fact(DisplayName = "[Integration - Abnormal] Assistant tries to edit dentist schedule")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_Assistant_Cannot_Edit_Schedule()
        {
            SetupHttpContext("assistant", 101);

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(new EditScheduleCommand
            {
                ScheduleId = 1,
                WorkDate = DateTime.Today.AddDays(4),
                Shift = "evening"
            }, default));
        }

        [Fact(DisplayName = "[Integration - Abnormal] Dentist edits other's schedule")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_Dentist_Cannot_Edit_Others_Schedule()
        {
            SetupHttpContext("dentist", 999); // not matched

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(new EditScheduleCommand
            {
                ScheduleId = 1,
                WorkDate = DateTime.Today.AddDays(5),
                Shift = "morning"
            }, default));
        }
    }
}
