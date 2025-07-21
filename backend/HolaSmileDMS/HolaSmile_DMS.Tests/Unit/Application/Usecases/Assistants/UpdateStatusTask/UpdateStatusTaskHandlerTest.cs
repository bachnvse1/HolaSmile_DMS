using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.UpdateTaskStatus;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants
{
    public class UpdateTaskStatusHandlerTests
    {
        private readonly Mock<ITaskRepository> _taskRepoMock = new();
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly UpdateTaskStatusHandler _handler;

        public UpdateTaskStatusHandlerTests()
        {
            _handler = new UpdateTaskStatusHandler(
                _taskRepoMock.Object,
                _httpContextAccessorMock.Object
            );
        }

        private void SetupHttpContext(string? role, string? roleTableId = "1")
        {
            if (role == null)
            {
                _httpContextAccessorMock.Setup(h => h.HttpContext).Returns((HttpContext?)null);
                return;
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role),
                new Claim("role_table_id", roleTableId ?? "")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = principal };

            _httpContextAccessorMock.Setup(h => h.HttpContext).Returns(context);
        }

        [Fact(DisplayName = "UTCID01 - Assistant updates task status successfully")]
        public async System.Threading.Tasks.Task UTCID01_Assistant_Update_Task_Successfully()
        {
            // Arrange
            SetupHttpContext("Assistant", "1");

            var task = new Task
            {
                TaskID = 10,
                AssistantID = 1,
                Status = false
            };

            _taskRepoMock.Setup(r => r.GetTaskByIdAsync(10, It.IsAny<CancellationToken>()))
                .ReturnsAsync(task);
            _taskRepoMock.Setup(r => r.UpdateTaskAsync(It.IsAny<Task>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            var command = new UpdateTaskStatusCommand { TaskId = 10, Status = true };

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG97, result); // Lưu thành công
            Assert.True(task.Status);
            Assert.Equal(1, task.UpdatedBy);
        }

        [Fact(DisplayName = "UTCID02 - HttpContext null => UnauthorizedAccessException")]
        public async System.Threading.Tasks.Task UTCID02_HttpContext_Null_Should_Throw()
        {
            // Arrange
            SetupHttpContext(null);

            var command = new UpdateTaskStatusCommand { TaskId = 1, Status = true };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG53, ex.Message); // Chưa đăng nhập
        }

        [Fact(DisplayName = "UTCID03 - Role not Assistant => UnauthorizedAccessException")]
        public async System.Threading.Tasks.Task UTCID03_Role_Not_Assistant_Should_Throw()
        {
            // Arrange
            SetupHttpContext("Receptionist");

            var command = new UpdateTaskStatusCommand { TaskId = 1, Status = true };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message); // Không có quyền
        }

        [Fact(DisplayName = "UTCID04 - Task not found => KeyNotFoundException")]
        public async System.Threading.Tasks.Task UTCID04_Task_Not_Found_Should_Throw()
        {
            // Arrange
            SetupHttpContext("Assistant", "1");

            _taskRepoMock.Setup(r => r.GetTaskByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync((Task?)null);

            var command = new UpdateTaskStatusCommand { TaskId = 1, Status = true };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG16, ex.Message); // Không có dữ liệu phù hợp
        }

        [Fact(DisplayName = "UTCID05 - Task belongs to other assistant => UnauthorizedAccessException")]
        public async System.Threading.Tasks.Task UTCID05_Task_Belongs_To_Other_Should_Throw()
        {
            // Arrange
            SetupHttpContext("Assistant", "1");

            var task = new Task
            {
                TaskID = 1,
                AssistantID = 999
            };

            _taskRepoMock.Setup(r => r.GetTaskByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(task);

            var command = new UpdateTaskStatusCommand { TaskId = 1, Status = true };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message); // Không có quyền
        }

        [Fact(DisplayName = "UTCID06 - Update fails => return MSG58")]
        public async System.Threading.Tasks.Task UTCID06_Update_Fails_Should_Return_MSG58()
        {
            // Arrange
            SetupHttpContext("Assistant", "1");

            var task = new Task
            {
                TaskID = 1,
                AssistantID = 1,
                Status = false
            };

            _taskRepoMock.Setup(r => r.GetTaskByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(task);
            _taskRepoMock.Setup(r => r.UpdateTaskAsync(It.IsAny<Task>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);

            var command = new UpdateTaskStatusCommand { TaskId = 1, Status = true };

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG58, result); // Cập nhật thất bại
        }
    }
}
