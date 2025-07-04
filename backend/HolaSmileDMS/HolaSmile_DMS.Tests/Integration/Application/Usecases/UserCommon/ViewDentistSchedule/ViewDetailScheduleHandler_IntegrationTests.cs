using Application.Usecases.Dentist.ViewDentistSchedule;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.UserCommon.ViewDentistSchedule
{
    public class ViewDentistScheduleIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly ViewDentistScheduleHandle _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ViewDentistScheduleIntegrationTests()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase(databaseName: "TestDb_DentistSchedule"));

            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            SeedData();

            _handler = new ViewDentistScheduleHandle(
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

            var userDentist = new User { UserID = 101, Username = "dentist1", Fullname = "Dr. Smith", Avatar = "avatar.png", Phone = "0911111111"};
            var userOwner = new User { UserID = 102, Username = "owner1", Phone = "0922222222"};
            var userAssistant = new User { UserID = 103, Username = "assistant1", Phone = "0933333333"};

            _context.Users.AddRange(userDentist, userOwner, userAssistant);
            _context.SaveChanges();

            var dentist = new global::Dentist { DentistId = 201, UserId = 101, User = userDentist };
            _context.Dentists.Add(dentist);
            _context.SaveChanges();

            _context.Schedules.Add(new Schedule
            {
                ScheduleId = 1,
                DentistId = 201,
                WorkDate = DateTime.Today.AddDays(1),
                Shift = "morning",
                Status = "approved",
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                Dentist = dentist
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

        [Fact(DisplayName = "[Integration - Normal] Dentist can view own schedule")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task N_Dentist_View_Their_Schedule()
        {
            SetupHttpContext("dentist", 101);

            var result = await _handler.Handle(new ViewDentistScheduleCommand { DentistId = 201 }, default);

            Assert.NotNull(result);
            Assert.Single(result);
            Assert.Equal("Dr. Smith", result[0].DentistName);
        }

        [Fact(DisplayName = "[Integration - Normal] Owner can view dentist schedule")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task N_Owner_View_Dentist_Schedule()
        {
            SetupHttpContext("owner", 102);

            var result = await _handler.Handle(new ViewDentistScheduleCommand { DentistId = 201 }, default);

            Assert.NotNull(result);
            Assert.Single(result);
            Assert.Equal("Dr. Smith", result[0].DentistName);
        }

        [Fact(DisplayName = "[Integration - Abnormal] Dentist cannot view others schedule")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_Dentist_Cannot_View_Other_Dentist_Schedule()
        {
            SetupHttpContext("dentist", 999); // user ID not mapped to any dentist

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new ViewDentistScheduleCommand { DentistId = 201 }, default));
        }
    }

}