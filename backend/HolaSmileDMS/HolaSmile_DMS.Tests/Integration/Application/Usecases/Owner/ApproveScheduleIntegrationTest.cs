using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Application.Usecases.Owner;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Owner
{
    public class ApproveScheduleIntegrationTest
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ApproveScheduleHandle _handler;

        public ApproveScheduleIntegrationTest()
        {
            var services = new ServiceCollection();
            services.AddDbContext<ApplicationDbContext>(opt => opt.UseInMemoryDatabase("ScheduleTestDb"));
            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            SeedData();
            _handler = new ApproveScheduleHandle(new ScheduleRepository(_context), _httpContextAccessor);
        }

        private void SeedData()
        {
            _context.Schedules.RemoveRange(_context.Schedules);
            _context.Schedules.AddRange(
                new Schedule { ScheduleId = 1, Status = "pending", DentistId = 1, WorkDate = DateTime.Now, Shift = "morning", IsActive = true },
                new Schedule { ScheduleId = 2, Status = "pending", DentistId = 2, WorkDate = DateTime.Now, Shift = "morning", IsActive = true }
            );
            _context.SaveChanges();
        }

        private void SetupHttpContext(string role, int userId)
        {
            var identity = new ClaimsIdentity(new[]
            {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        }, "Test");

            _httpContextAccessor.HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(identity)
            };
        }

        [Fact(DisplayName = "[Integration-Normal] Approve_Schedule_Success")]
        public async System.Threading.Tasks.Task Approve_Schedule_Success()
        {
            SetupHttpContext("owner", 100);
            var cmd = new ApproveDentistScheduleCommand { ScheduleIds = new List<int> { 1 }, Action = "approved" };

            var result = await _handler.Handle(cmd, default);

            Assert.Equal("Duyệt lịch làm việc thành công", result);
            var updated = await _context.Schedules.FindAsync(1);
            Assert.Equal("approved", updated.Status);
        }

        [Fact(DisplayName = "[Integration-Abnormal] Reject_InvalidSchedule_Throws")]
        public async System.Threading.Tasks.Task Reject_InvalidSchedule_Throws()
        {
            SetupHttpContext("owner", 101);
            var cmd = new ApproveDentistScheduleCommand { ScheduleIds = new List<int> { 999 }, Action = "rejected" };

            await Assert.ThrowsAsync<Exception>(() => _handler.Handle(cmd, default));
        }
    }
}
