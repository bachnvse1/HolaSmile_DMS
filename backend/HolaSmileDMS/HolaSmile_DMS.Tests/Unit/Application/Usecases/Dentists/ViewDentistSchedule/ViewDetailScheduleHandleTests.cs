using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentist.ViewAllDentistSchedule;
using Application.Usecases.Dentist.ViewDentistSchedule;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Dentists.ViewDentistSchedule
{
    public class ViewDetailScheduleHandleTests
    {
        private readonly Mock<IDentistRepository> _dentistRepoMock;
        private readonly Mock<IScheduleRepository> _scheduleRepoMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly ViewDetailScheduleHandle _handler;

        public ViewDetailScheduleHandleTests()
        {
            _dentistRepoMock = new Mock<IDentistRepository>();
            _scheduleRepoMock = new Mock<IScheduleRepository>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _mapperMock = new Mock<IMapper>();

            _handler = new ViewDetailScheduleHandle(
                _dentistRepoMock.Object,
                _mapperMock.Object,
                _scheduleRepoMock.Object,
                _httpContextAccessorMock.Object
            );
        }

        private void SetupHttpContext(string role, int userId)
        {
            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        }));

            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(new DefaultHttpContext { User = user });
        }

        [Fact(DisplayName = "UTCID01 - Normal - Admin có thể xem chi tiết lịch")]
        public async System.Threading.Tasks.Task UTCID01_Admin_Can_View_Schedule()
        {
            SetupHttpContext("admin", 1);
            var schedule = new Schedule { ScheduleId = 10, DentistId = 2 };
            var dto = new ScheduleDTO();

            _scheduleRepoMock.Setup(x => x.GetScheduleByIdAsync(10)).ReturnsAsync(schedule);
            _mapperMock.Setup(m => m.Map<ScheduleDTO>(schedule)).Returns(dto);

            var result = await _handler.Handle(new ViewDetailScheduleCommand(10), default);

            Assert.NotNull(result);
            Assert.Equal(dto, result);
        }

        [Fact(DisplayName = "UTCID02 - Normal - Dentist xem đúng lịch của mình")]
        public async System.Threading.Tasks.Task UTCID02_Dentist_Can_View_Own_Schedule()
        {
            SetupHttpContext("dentist", 5);
            var schedule = new Schedule { ScheduleId = 20, DentistId = 3 };
            var dentist = new Dentist { DentistId = 3, UserId = 5 };
            var dto = new ScheduleDTO();

            _scheduleRepoMock.Setup(x => x.GetScheduleByIdAsync(20)).ReturnsAsync(schedule);
            _dentistRepoMock.Setup(x => x.GetDentistByUserIdAsync(5)).ReturnsAsync(dentist);
            _mapperMock.Setup(m => m.Map<ScheduleDTO>(schedule)).Returns(dto);

            var result = await _handler.Handle(new ViewDetailScheduleCommand(20), default);

            Assert.NotNull(result);
        }

        [Fact(DisplayName = "UTCID03 - Abnormal - Không đăng nhập")]
        public async System.Threading.Tasks.Task UTCID03_Unauthorized_No_User()
        {
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns((HttpContext)null);

            var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new ViewDetailScheduleCommand(1), default));

            Assert.Equal(MessageConstants.MSG.MSG53, exception.Message);
        }

        [Fact(DisplayName = "UTCID04 - Abnormal - Lịch không tồn tại")]
        public async System.Threading.Tasks.Task UTCID04_Schedule_Not_Found()
        {
            SetupHttpContext("admin", 1);
            _scheduleRepoMock.Setup(x => x.GetScheduleByIdAsync(999)).ReturnsAsync((Schedule)null);

            var exception = await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(new ViewDetailScheduleCommand(999), default));

            Assert.Equal(MessageConstants.MSG.MSG28, exception.Message);
        }

        [Fact(DisplayName = "UTCID05 - Abnormal - Dentist cố xem lịch của người khác")]
        public async System.Threading.Tasks.Task UTCID05_Dentist_View_Other_Schedule_Throws()
        {
            SetupHttpContext("dentist", 7);
            var schedule = new Schedule { ScheduleId = 15, DentistId = 999 };
            var dentist = new Dentist { DentistId = 123, UserId = 7 };

            _scheduleRepoMock.Setup(x => x.GetScheduleByIdAsync(15)).ReturnsAsync(schedule);
            _dentistRepoMock.Setup(x => x.GetDentistByUserIdAsync(7)).ReturnsAsync(dentist);

            var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new ViewDetailScheduleCommand(15), default));

            Assert.Equal(MessageConstants.MSG.MSG26, exception.Message);
        }
    }
}
