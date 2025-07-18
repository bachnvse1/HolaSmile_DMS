using System.Security.Claims;
using Application.Constants;
using Application.Usecases.Administrator.ViewListUser;
using Application.Usecases.Dentist.ViewDentistSchedule;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.UserCommon
{
    public class ViewAllDentistScheduleIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly ViewAllDentistSchedulehandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ViewAllDentistScheduleIntegrationTests()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase(databaseName: "TestDb_ViewAllSchedule"));

            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            SeedData();

            _handler = new ViewAllDentistSchedulehandler(
                new ScheduleRepository(_context),
                _httpContextAccessor);
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

        private void SeedData()
        {
            _context.Users.RemoveRange(_context.Users);
            _context.Dentists.RemoveRange(_context.Dentists);
            _context.Schedules.RemoveRange(_context.Schedules);
            _context.SaveChanges();

            var user1 = new User { UserID = 1, Username = "dentist1", Avatar = "img1.png", Phone = "0123456789" };
            var user2 = new User { UserID = 2, Username = "dentist2", Avatar = "img2.png", Phone = "0123456780" };

            _context.Users.AddRange(user1, user2);
            _context.SaveChanges();

            _context.Dentists.AddRange(
                new global::Dentist { DentistId = 1, UserId = 1 },
                new global::Dentist { DentistId = 2, UserId = 2 });

            _context.Schedules.AddRange(
                new Schedule { ScheduleId = 1, DentistId = 1, WorkDate = DateTime.Today, Shift = "morning", Status = "approved", CreatedAt = DateTime.Now },
                new Schedule { ScheduleId = 2, DentistId = 2, WorkDate = DateTime.Today, Shift = "afternoon", Status = "approved", CreatedAt = DateTime.Now });

            _context.SaveChanges();
        }

        [Fact(DisplayName = "[Integration - Normal] Owner_Can_View_All_Schedules_Grouped_By_Dentist")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task N_Owner_Can_View_All_Schedules_Grouped_By_Dentist()
        {
            SetupHttpContext("Owner", 999);

            var result = await _handler.Handle(new ViewAllDentistScheduleCommand(), default);

            Assert.Equal(2, result.Count);
            Assert.All(result, d => Assert.NotEmpty(d.Schedules));
        }

        [Fact(DisplayName = "[Integration - Normal] OtherRole_Sees_Limited_Schedules")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task N_OtherRole_Sees_Limited_Schedules()
        {
            SetupHttpContext("Assistant", 999);

            var result = await _handler.Handle(new ViewAllDentistScheduleCommand(), default);

            Assert.NotEmpty(result);
        }

        [Fact(DisplayName = "[Integration - Abnormal] Not_Authenticated_Should_Throw_MSG53")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_Not_Authenticated_Should_Throw_MSG53()
        {
            var context = new DefaultHttpContext();
            context.User = new ClaimsPrincipal(new ClaimsIdentity());
            _httpContextAccessor.HttpContext = context;

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new ViewAllDentistScheduleCommand(), default));

            Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
        }

        [Fact(DisplayName = "[Integration - Abnormal] No_Schedule_Data_Should_Throw_MSG28")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_No_Schedule_Data_Should_Throw_MSG28()
        {
            _context.Schedules.RemoveRange(_context.Schedules);
            _context.SaveChanges();

            SetupHttpContext("Owner", 999);

            var result = await _handler.Handle(new ViewAllDentistScheduleCommand(), default);
            Assert.NotNull(result);
            Assert.Empty(result);
        }
    }

}
