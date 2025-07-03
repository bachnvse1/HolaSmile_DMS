using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentist.ViewDentistSchedule;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Dentists.ViewDentistSchedule
{
    public class ViewDentistScheduleHandlerTests
    {
        private readonly Mock<IDentistRepository> _dentistRepo = new();
        private readonly Mock<IScheduleRepository> _scheduleRepo = new();
        private readonly Mock<IHttpContextAccessor> _httpContextAccessor = new();
        private readonly ViewDentistScheduleHandle _handler;

        public ViewDentistScheduleHandlerTests()
        {
            _handler = new ViewDentistScheduleHandle(_dentistRepo.Object, _scheduleRepo.Object, _httpContextAccessor.Object);
        }

        private void SetupContext(string? role, string userId = "1")
        {
            var claims = new List<Claim>();
            if (role != null)
                claims.Add(new Claim(ClaimTypes.Role, role));
            claims.Add(new Claim(ClaimTypes.NameIdentifier, userId));
            var identity = new ClaimsIdentity(claims);
            var user = new ClaimsPrincipal(identity);
            _httpContextAccessor.Setup(x => x.HttpContext).Returns(new DefaultHttpContext { User = user });
        }

        [Fact(DisplayName = "UTCID01 - Dentist requests their own schedule → return schedules")]
        public async System.Threading.Tasks.Task ITCID01_Dentist_ReturnsOwnSchedules()
        {
            SetupContext("dentist", "1");

            var dentist = new global::Dentist { DentistId = 100, User = new User { UserID = 1 } };
            var schedules = new List<Schedule> {
            new Schedule { ScheduleId = 1, WorkDate = DateTime.Today, Shift = "morning", Status = "approved", DentistId = 100, Dentist = dentist, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now }
        };

            _dentistRepo.Setup(r => r.GetDentistByUserIdAsync(1)).ReturnsAsync(dentist);
            _scheduleRepo.Setup(r => r.GetDentistSchedulesByDentistIdAsync(100)).ReturnsAsync(schedules);

            var result = await _handler.Handle(new ViewDentistScheduleCommand { DentistId = 100 }, default);

            Assert.Single(result);
            Assert.Equal(100, result[0].DentistID);
            Assert.Single(result[0].Schedules);
        }

        [Fact(DisplayName = "UTCID02 - Dentist requests another dentist's schedule → throw MSG26")]
        public async System.Threading.Tasks.Task ITCID02_DentistRequestsOthersSchedule_ThrowsMSG26()
        {
            SetupContext("dentist", "1");
            var dentist = new global::Dentist { DentistId = 101, User = new User { UserID = 1 } }; // not match with request.DentistId
            _dentistRepo.Setup(r => r.GetDentistByUserIdAsync(1)).ReturnsAsync(dentist);

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(new ViewDentistScheduleCommand { DentistId = 102 }, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID03 - Owner requests any dentist's schedule → return schedules")]
        public async System.Threading.Tasks.Task ITCID03_OwnerRequestsAnySchedule_Returns()
        {
            SetupContext("owner", "99");

            var schedules = new List<Schedule> {
            new Schedule { ScheduleId = 1, WorkDate = DateTime.Today, Shift = "morning", Status = "approved", DentistId = 200, Dentist = new global::Dentist { DentistId = 200, User = new User { Fullname = "Dr. Owner" } }, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now }
        };

            _scheduleRepo.Setup(r => r.GetDentistSchedulesByDentistIdAsync(200)).ReturnsAsync(schedules);

            var result = await _handler.Handle(new ViewDentistScheduleCommand { DentistId = 200 }, default);

            Assert.Single(result);
            Assert.Equal(200, result[0].DentistID);
        }

        [Fact(DisplayName = "UTCID04 - Patient/guest requests dentist schedule → return approved schedules")]
        public async System.Threading.Tasks.Task ITCID04_PatientOrGuest_SeeApprovedOnly()
        {
            SetupContext("patient", "3");

            var schedules = new List<Schedule> {
            new Schedule { ScheduleId = 1, WorkDate = DateTime.Today, Shift = "evening", Status = "approved", DentistId = 300, Dentist = new global::Dentist { DentistId = 300, User = new User { Fullname = "Dr. C" } }, CreatedAt = DateTime.Now, UpdatedAt = DateTime.Now }
        };

            _scheduleRepo.Setup(r => r.GetDentistApprovedSchedulesByDentistIdAsync(300)).ReturnsAsync(schedules);

            var result = await _handler.Handle(new ViewDentistScheduleCommand { DentistId = 300 }, default);

            Assert.Single(result);
            Assert.Equal("evening", result[0].Schedules[0].Shift);
        }
    }
}