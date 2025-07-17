using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentist.ManageSchedule;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Dentists
{
    public class CreateScheduleHandleTests
    {
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly Mock<IScheduleRepository> _scheduleRepoMock = new();
        private readonly Mock<IDentistRepository> _dentistRepoMock = new();
        private readonly Mock<IOwnerRepository> _ownerRepoMock = new();
        private readonly Mock<IMediator> _mediatorMock = new();
        private readonly CreateScheduleHandle _handler;

        public CreateScheduleHandleTests()
        {
            // Setup mocks for dependencies
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _scheduleRepoMock = new Mock<IScheduleRepository>();
            _dentistRepoMock = new Mock<IDentistRepository>();
            _ownerRepoMock = new Mock<IOwnerRepository>();
            _mediatorMock = new Mock<IMediator>();
            // Initialize the handler with the mocked dependencies
            _handler = new CreateScheduleHandle(
                _httpContextAccessorMock.Object,
                _scheduleRepoMock.Object,
                _dentistRepoMock.Object,
                _ownerRepoMock.Object,
                _mediatorMock.Object
            );
        }

        private void SetupHttpContext(string role, int userId)
        {
            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        }, "mock"));

            var context = new DefaultHttpContext { User = user };
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);
        }

        [Fact(DisplayName = "UTCID01 - Abnormal - Chưa đăng nhập")]
        public async System.Threading.Tasks.Task UTCID01_Unauthorized_NotLoggedIn()
        {
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns((HttpContext)null);

            var command = new CreateScheduleCommand { RegisSchedules = new List<CreateScheduleDTO>() };
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
        }

        [Fact(DisplayName = "UTCID02 - Abnormal - Role không phải dentist")]
        public async System.Threading.Tasks.Task UTCID02_Unauthorized_NotDentist()
        {
            SetupHttpContext("admin", 1);
            var command = new CreateScheduleCommand { RegisSchedules = new List<CreateScheduleDTO>() };

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
        }

        [Fact(DisplayName = "UTCID03 - Abnormal - WorkDate < Now")]
        public async System.Threading.Tasks.Task UTCID03_WorkDate_InPast()
        {
            SetupHttpContext("dentist", 1);
            _dentistRepoMock.Setup(r => r.GetDentistByUserIdAsync(1))
                .ReturnsAsync(new Dentist { DentistId = 5 });

            var command = new CreateScheduleCommand
            {
                RegisSchedules = new List<CreateScheduleDTO>
            {
                new CreateScheduleDTO { WorkDate = DateTime.Now.AddDays(-1), Shift = "morning" }
            }
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG34, ex.Message);
        }

        [Fact(DisplayName = "UTCID04 - Abnormal - Shift rỗng")]
        public async System.Threading.Tasks.Task UTCID04_Empty_Shift()
        {
            SetupHttpContext("dentist", 1);
            _dentistRepoMock.Setup(r => r.GetDentistByUserIdAsync(1))
                .ReturnsAsync(new Dentist { DentistId = 5 });

            var command = new CreateScheduleCommand
            {
                RegisSchedules = new List<CreateScheduleDTO>
            {
                new CreateScheduleDTO { WorkDate = DateTime.Now.AddDays(1), Shift = "   " }
            }
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
        }

        [Fact(DisplayName = "UTCID05 - Abnormal - Trùng lịch trạng thái Approved")]
        public async System.Threading.Tasks.Task UTCID05_DuplicateScheduleApproved()
        {
            SetupHttpContext("dentist", 1);
            var dentistId = 5;
            _dentistRepoMock.Setup(r => r.GetDentistByUserIdAsync(1))
                .ReturnsAsync(new Dentist { DentistId = dentistId });

            var scheduleDate = DateTime.Now.AddDays(1);
            var command = new CreateScheduleCommand
            {
                RegisSchedules = new List<CreateScheduleDTO>
            {
                new CreateScheduleDTO { WorkDate = scheduleDate, Shift = "morning" }
            }
            };

            _scheduleRepoMock.Setup(r => r.GetWeekStart(It.IsAny<DateTime>())).Returns(scheduleDate.Date);
            _scheduleRepoMock.Setup(r => r.CheckDulplicateScheduleAsync(dentistId, scheduleDate, "morning", 0))
                .ReturnsAsync(new Schedule { Status = "approved", ScheduleId = 10 });

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG89, ex.Message);
        }

        [Fact(DisplayName = "UTCID06 - Normal - Tạo thành công sau khi xóa lịch bị từ chối")]
        public async System.Threading.Tasks.Task UTCID06_CreateSchedule_Success_When_PreviouslyRejected()
        {
            SetupHttpContext("dentist", 1);
            var dentistId = 5;
            var scheduleDate = DateTime.Now.AddDays(1);

            _dentistRepoMock.Setup(r => r.GetDentistByUserIdAsync(1))
                .ReturnsAsync(new Dentist { DentistId = dentistId });

            _scheduleRepoMock.Setup(r => r.GetWeekStart(It.IsAny<DateTime>())).Returns(scheduleDate.Date);

            _scheduleRepoMock.Setup(r => r.CheckDulplicateScheduleAsync(dentistId, scheduleDate, "morning", 0))
                .ReturnsAsync(new Schedule { Status = "rejected", ScheduleId = 99 });

            _scheduleRepoMock.Setup(r => r.DeleteSchedule(99, 1)).ReturnsAsync(true);
            _scheduleRepoMock.Setup(r => r.RegisterScheduleByDentist(It.IsAny<Schedule>()))
                .ReturnsAsync(true);

            var command = new CreateScheduleCommand
            {
                RegisSchedules = new List<CreateScheduleDTO>
            {
                new CreateScheduleDTO { WorkDate = scheduleDate, Shift = "morning" }
            }
            };

            var result = await _handler.Handle(command, default);
            Assert.Equal(MessageConstants.MSG.MSG52, result);
        }

        [Fact(DisplayName = "UTCID07 - Abnormal - Đăng ký thất bại")]
        public async System.Threading.Tasks.Task UTCID07_Fail_To_Register_Schedule()
        {
            SetupHttpContext("dentist", 1);
            var dentistId = 5;
            var scheduleDate = DateTime.Now.AddDays(1);

            _dentistRepoMock.Setup(r => r.GetDentistByUserIdAsync(1))
                .ReturnsAsync(new Dentist { DentistId = dentistId });

            _scheduleRepoMock.Setup(r => r.GetWeekStart(It.IsAny<DateTime>())).Returns(scheduleDate.Date);
            _scheduleRepoMock.Setup(r => r.CheckDulplicateScheduleAsync(dentistId, scheduleDate, "morning", 0))
                .ReturnsAsync((Schedule)null);

            _scheduleRepoMock.Setup(r => r.RegisterScheduleByDentist(It.IsAny<Schedule>()))
                .ReturnsAsync(false);

            var command = new CreateScheduleCommand
            {
                RegisSchedules = new List<CreateScheduleDTO>
            {
                new CreateScheduleDTO { WorkDate = scheduleDate, Shift = "morning" }
            }
            };

            var result = await _handler.Handle(command, default);
            Assert.Equal(MessageConstants.MSG.MSG73, result);
        }
    }
}
