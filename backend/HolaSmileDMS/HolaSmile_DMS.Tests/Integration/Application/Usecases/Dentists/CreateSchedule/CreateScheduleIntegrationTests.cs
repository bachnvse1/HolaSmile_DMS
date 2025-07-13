using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentist.ManageSchedule;
using Application.Usecases.Dentist.ViewAllDentistSchedule;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Dentists
{
    public class CreateScheduleIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMediator _mediator;
        private readonly CreateScheduleHandle _handler;
        private readonly Mock<IMediator> _mediatorMock; // 👈 để verify nếu cần

        public CreateScheduleIntegrationTests()
        {
            _mediatorMock = new Mock<IMediator>();

            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("TestDB_CreateSchedule"));

            services.AddHttpContextAccessor();

            // ✅ Đăng ký đúng kiểu IMediator với mock object
            services.AddSingleton<IMediator>(_mediatorMock.Object);

            var provider = services.BuildServiceProvider();

            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();
            _mediator = provider.GetRequiredService<IMediator>(); // sẽ lấy mock đã đăng ký

            SeedData();

            _handler = new CreateScheduleHandle(
                _httpContextAccessor,
                new ScheduleRepository(_context),
                new DentistRepository(_context),
                new OwnerRepository(_context),
                _mediator
                );
        }

        private void SeedData()
        {
            _context.Users.RemoveRange(_context.Users);
            _context.Dentists.RemoveRange(_context.Dentists);
            _context.Schedules.RemoveRange(_context.Schedules);
            _context.SaveChanges();

            var dentistUser = new User { UserID = 101, Username = "0987654321", Phone = "0987654321" };
            _context.Users.Add(dentistUser);
            _context.SaveChanges();

            var dentist = new global::Dentist { DentistId = 201, UserId = 101, User = dentistUser };
            _context.Dentists.Add(dentist);
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

        [Fact(DisplayName = "[Integration - Normal] Dentist creates new schedule successfully")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task N_Dentist_Create_Schedule_Success()
        {
            SetupHttpContext("dentist", 101);

            var command = new CreateScheduleCommand
            {
                RegisSchedules = new List<CreateScheduleDTO>
            {
                new CreateScheduleDTO
                {
                    WorkDate = DateTime.Today.AddDays(2),
                    Shift = "morning"
                }
            }
            };

            var result = await _handler.Handle(command, default);

            Assert.Equal(MessageConstants.MSG.MSG52, result);
        }

        [Fact(DisplayName = "[Integration - Abnormal] Unauthorized role throws exception")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_NonDentist_Cannot_Create_Schedule()
        {
            SetupHttpContext("assistant", 102);

            var command = new CreateScheduleCommand
            {
                RegisSchedules = new List<CreateScheduleDTO>
            {
                new CreateScheduleDTO
                {
                    WorkDate = DateTime.Today.AddDays(2),
                    Shift = "morning"
                }
            }
            };

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
        }

        [Fact(DisplayName = "[Integration - Abnormal] Invalid date throws exception")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_Dentist_Schedule_InvalidDate_Throws()
        {
            SetupHttpContext("dentist", 101);

            var command = new CreateScheduleCommand
            {
                RegisSchedules = new List<CreateScheduleDTO>
            {
                new CreateScheduleDTO
                {
                    WorkDate = DateTime.Today.AddDays(-1),
                    Shift = "morning"
                }
            }
            };

            await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        }
    }

}
