using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentist.AssignTasksToAssistantHandler;
using Application.Usecases.SendNotification;
using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Dentists
{
    public class AssignTaskToAssistantHandlerTest
    {
        private readonly Mock<ITaskRepository> _taskRepoMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly Mock<IMediator> _mediatorMock;
        private readonly Mock<IUserCommonRepository> _userCommonRepoMock;
        private readonly AssignTaskToAssistantHandler _handler;

        public AssignTaskToAssistantHandlerTest()
        {
            _taskRepoMock = new Mock<ITaskRepository>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _mediatorMock = new Mock<IMediator>();
            _userCommonRepoMock = new Mock<IUserCommonRepository>();

            _handler = new AssignTaskToAssistantHandler(
                _taskRepoMock.Object,
                _httpContextAccessorMock.Object,
                _mediatorMock.Object,
                _userCommonRepoMock.Object
            );
        }

        private void SetupHttpContext(string role, string userId = "1")
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, userId)
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = principal };

            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);
        }

        [Fact(DisplayName = "UTCID01 - Normal - Giao việc thành công")]
        public async System.Threading.Tasks.Task UTCID01_Assign_Task_Success()
        {
            SetupHttpContext("Dentist", "1");
            var command = new AssignTaskToAssistantCommand
            {
                AssistantId = 2,
                TreatmentProgressId = 10,
                ProgressName = "Test",
                Description = "Desc",
                Status = true,
                StartTime = "08:00",
                EndTime = "09:00"
            };

            _taskRepoMock.Setup(x => x.GetTreatmentProgressByIdAsync(10, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new TreatmentProgress { EndTime = DateTime.Today.AddHours(10) });

            _taskRepoMock.Setup(x => x.CreateTaskAsync(It.IsAny<Task>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            _userCommonRepoMock.Setup(x => x.GetUserIdByRoleTableIdAsync("assistant", 2))
                .ReturnsAsync(999);

            var result = await _handler.Handle(command, default);

            Assert.Equal(MessageConstants.MSG.MSG46, result);
        }

        [Fact(DisplayName = "UTCID02 - Abnormal - Không phải Dentist")]
        public async System.Threading.Tasks.Task UTCID02_Not_Dentist_Should_Throw()
        {
            SetupHttpContext("Assistant", "1");

            var command = new AssignTaskToAssistantCommand();

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID03 - Abnormal - Sai định dạng StartTime")]
        public async System.Threading.Tasks.Task UTCID03_Invalid_StartTime_Format()
        {
            SetupHttpContext("Dentist", "1");

            var command = new AssignTaskToAssistantCommand
            {
                StartTime = "abc",
                EndTime = "09:00"
            };

            await Assert.ThrowsAsync<FormatException>(() => _handler.Handle(command, default));
        }

        [Fact(DisplayName = "UTCID04 - Abnormal - EndTime trước StartTime")]
        public async System.Threading.Tasks.Task UTCID04_EndTime_Before_StartTime()
        {
            SetupHttpContext("Dentist", "1");

            var command = new AssignTaskToAssistantCommand
            {
                StartTime = "10:00",
                EndTime = "09:00"
            };

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _handler.Handle(command, default));
            Assert.Equal("Thời gian kết thúc phải sau thời gian bắt đầu.", ex.Message);
        }

        [Fact(DisplayName = "UTCID05 - Abnormal - Tiến trình không tồn tại")]
        public async System.Threading.Tasks.Task UTCID05_TreatmentProgress_Not_Found()
        {
            SetupHttpContext("Dentist", "1");

            _taskRepoMock.Setup(x => x.GetTreatmentProgressByIdAsync(10, It.IsAny<CancellationToken>()))
                .ReturnsAsync((TreatmentProgress?)null);

            var command = new AssignTaskToAssistantCommand
            {
                TreatmentProgressId = 10,
                StartTime = "08:00",
                EndTime = "09:00"
            };

            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
        }

        [Fact(DisplayName = "UTCID06 - Abnormal - Tiến trình không có EndTime")]
        public async System.Threading.Tasks.Task UTCID06_TreatmentProgress_EndTime_Null()
        {
            SetupHttpContext("Dentist", "1");

            _taskRepoMock.Setup(x => x.GetTreatmentProgressByIdAsync(10, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new TreatmentProgress { EndTime = null });

            var command = new AssignTaskToAssistantCommand
            {
                TreatmentProgressId = 10,
                StartTime = "08:00",
                EndTime = "09:00"
            };

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _handler.Handle(command, default));
            Assert.Equal("Tiến trình chưa có thời gian kết thúc cụ thể.", ex.Message);
        }

        [Fact(DisplayName = "UTCID07 - Abnormal - Thời gian vượt quá tiến trình")]
        public async System.Threading.Tasks.Task UTCID07_Task_Time_Exceeds_Treatment_End()
        {
            SetupHttpContext("Dentist", "1");

            _taskRepoMock.Setup(x => x.GetTreatmentProgressByIdAsync(10, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new TreatmentProgress { EndTime = DateTime.Today.AddHours(9) });

            var command = new AssignTaskToAssistantCommand
            {
                TreatmentProgressId = 10,
                StartTime = "08:00",
                EndTime = "10:00"
            };

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG92, ex.Message);
        }

        [Fact(DisplayName = "UTCID08 - Abnormal - Tạo task thất bại")]
        public async System.Threading.Tasks.Task UTCID08_Task_Creation_Fails()
        {
            SetupHttpContext("Dentist", "1");

            _taskRepoMock.Setup(x => x.GetTreatmentProgressByIdAsync(10, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new TreatmentProgress { EndTime = DateTime.Today.AddHours(10) });

            _taskRepoMock.Setup(x => x.CreateTaskAsync(It.IsAny<Task>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);

            var command = new AssignTaskToAssistantCommand
            {
                TreatmentProgressId = 10,
                StartTime = "08:00",
                EndTime = "09:00"
            };

            var result = await _handler.Handle(command, default);

            Assert.Equal(MessageConstants.MSG.MSG58, result);
        }
    }
}
