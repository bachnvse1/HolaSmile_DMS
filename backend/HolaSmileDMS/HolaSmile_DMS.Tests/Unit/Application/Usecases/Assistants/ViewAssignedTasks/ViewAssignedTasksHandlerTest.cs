using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.ViewAssignedTasks;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants
{
    public class ViewAssignedTasksHandlerTests
    {
        private readonly Mock<ITaskRepository> _repoMock = new();
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly ViewAssignedTasksHandler _handler;

        public ViewAssignedTasksHandlerTests()
        {
            _handler = new ViewAssignedTasksHandler(
                _repoMock.Object,
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

        [Fact(DisplayName = "UTCID01 - Assistant views assigned tasks successfully")]
        public async System.Threading.Tasks.Task UTCID01_Assistant_View_Successfully()
        {
            // Arrange
            SetupHttpContext("Assistant", "5");

            var mockTasks = new List<AssignedTaskDto>
            {
                new AssignedTaskDto { TaskId = 1, ProgressName = "Progress 1", Status = "Assigned" },
                new AssignedTaskDto { TaskId = 2, ProgressName = "Progress 2", Status = "InProgress" }
            };

            _repoMock.Setup(r => r.GetTasksByAssistantIdAsync(5, It.IsAny<CancellationToken>()))
                .ReturnsAsync(mockTasks);

            // Act
            var result = await _handler.Handle(new ViewAssignedTasksCommand(), default);

            // Assert
            Assert.Equal(2, result.Count);
            Assert.Equal("Progress 1", result[0].ProgressName);
            Assert.Equal("Progress 2", result[1].ProgressName);
        }

        [Fact(DisplayName = "UTCID02 - Dentist views assigned tasks successfully")]
        public async System.Threading.Tasks.Task UTCID02_Dentist_View_Successfully()
        {
            // Arrange
            SetupHttpContext("Dentist", "10");

            var mockTasks = new List<AssignedTaskDto>
            {
                new AssignedTaskDto { TaskId = 3, ProgressName = "Progress D", Status = "Done" }
            };

            _repoMock.Setup(r => r.GetTasksByAssistantIdAsync(10, It.IsAny<CancellationToken>()))
                .ReturnsAsync(mockTasks);

            // Act
            var result = await _handler.Handle(new ViewAssignedTasksCommand(), default);

            // Assert
            Assert.Single(result);
            Assert.Equal("Progress D", result[0].ProgressName);
        }

        [Fact(DisplayName = "UTCID03 - HttpContext is null => UnauthorizedAccessException")]
        public async System.Threading.Tasks.Task UTCID03_HttpContext_Null_Should_Throw()
        {
            // Arrange
            SetupHttpContext(null);

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new ViewAssignedTasksCommand(), default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID04 - Role is not Assistant or Dentist => UnauthorizedAccessException")]
        public async System.Threading.Tasks.Task UTCID04_Invalid_Role_Should_Throw()
        {
            // Arrange
            SetupHttpContext("Receptionist");

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new ViewAssignedTasksCommand(), default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID05 - Missing role_table_id claim => UnauthorizedAccessException")]
        public async System.Threading.Tasks.Task UTCID05_Missing_RoleTableId_Should_Throw()
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, "Assistant")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = principal };

            _httpContextAccessorMock.Setup(h => h.HttpContext).Returns(context);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new ViewAssignedTasksCommand(), default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }
    }
}
