using System.Security.Claims;
using Application.Constants;
using Application.Usecases.Owner;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Owner
{
    public class ApproveScheduleIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly ApproveScheduleHandle _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ApproveScheduleIntegrationTests()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("TestDb_ApproveSchedule"));

            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            SeedData();

            _handler = new ApproveScheduleHandle(
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

            // Seed Owner user (người thực hiện approve)
            _context.Users.Add(new User
            {
                UserID = 999,
                Username = "owner1",
                Phone = "0900000000"
            });

            // Seed Dentist user
            _context.Users.Add(new User
            {
                UserID = 100,
                Username = "dentist1",
                Phone = "0901111111"
            });

            // Seed Dentist
            _context.Dentists.Add(new global::Dentist
            {
                DentistId = 101,
                UserId = 100
            });

            // Seed Schedule gắn với DentistId = 101
            _context.Schedules.AddRange(
                new Schedule
                {
                    ScheduleId = 1,
                    DentistId = 101,
                    WorkDate = DateTime.Today.AddDays(1),
                    Shift = "morning",
                    Status = "pending",
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now,
                    IsActive = true
                },
                new Schedule
                {
                    ScheduleId = 2,
                    DentistId = 101,
                    WorkDate = DateTime.Today.AddDays(2),
                    Shift = "afternoon",
                    Status = "pending",
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now,
                    IsActive = true
                },
                new Schedule
                {
                    ScheduleId = 3,
                    DentistId = 101,
                    WorkDate = DateTime.Today.AddDays(3),
                    Shift = "evening",
                    Status = "approved",
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now,
                    IsActive = true
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

        [Fact(DisplayName = "[Integration - Normal] Owner Approves Schedule Successfully")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task N_Owner_Can_Approve_Pending_Schedule()
        {
            SetupHttpContext("owner", 999);

            var result = await _handler.Handle(new ApproveDentistScheduleCommand
            {
                Action = "approved",
                ScheduleIds = new List<int> { 1 }
            }, default);

            Assert.Equal(MessageConstants.MSG.MSG80, result);
            Assert.Equal("approved", _context.Schedules.Find(1)?.Status);
        }

        [Fact(DisplayName = "[Integration - Normal] Owner Rejects Schedule Successfully")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task N_Owner_Can_Reject_Pending_Schedule()
        {
            SetupHttpContext("owner", 999);

            var result = await _handler.Handle(new ApproveDentistScheduleCommand
            {
                Action = "rejected",
                ScheduleIds = new List<int> { 2 }
            }, default);

            Assert.Equal(MessageConstants.MSG.MSG81, result);
            Assert.Equal("rejected", _context.Schedules.Find(2)?.Status);
        }

        [Fact(DisplayName = "[Integration - Abnormal] Owner Tries To Approve Non-Pending Schedule")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_Owner_Cannot_Approve_NonPending_Schedule()
        {
            SetupHttpContext("owner", 999);

            await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(new ApproveDentistScheduleCommand
                {
                    Action = "approved",
                    ScheduleIds = new List<int> { 3 } // already approved
                }, default));
        }

        [Fact(DisplayName = "[Integration - Abnormal] Non-owner Cannot Approve Schedule")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_NonOwner_Cannot_Approve_Schedule()
        {
            SetupHttpContext("assistant", 888);

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new ApproveDentistScheduleCommand
                {
                    Action = "approved",
                    ScheduleIds = new List<int> { 1 }
                }, default));
        }
    }

}
