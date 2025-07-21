using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.ViewTaskDetails;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants
{
    public class ViewTaskDetailsHandlerTests
    {
        private readonly Mock<ITaskRepository> _repoMock = new();
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly ViewTaskDetailsHandler _handler;

        public ViewTaskDetailsHandlerTests()
        {
            _handler = new ViewTaskDetailsHandler(
                _repoMock.Object,
                _httpContextAccessorMock.Object
            );
        }

        private void SetupHttpContext(string? role, string? roleTableId = "5")
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

        [Fact(DisplayName = "UTCID01 - Assistant views task details successfully")]
        public async System.Threading.Tasks.Task UTCID01_Assistant_View_Successfully()
        {
            // Arrange
            SetupHttpContext("Assistant", "5");
            int assistantId = 5;

            var command = new ViewTaskDetailsCommand(taskId: 1);
            var mockTask = new Task
            {
                TaskID = 1,
                AssistantID = assistantId,
                ProgressName = "Progress A",
                Description = "Desc",
                Status = false,
                StartTime = new TimeSpan(9, 0, 0),
                EndTime = new TimeSpan(10, 0, 0),
                TreatmentProgress = new TreatmentProgress
                {
                    TreatmentProgressID = 101,
                    TreatmentRecord = new TreatmentRecord
                    {
                        TreatmentRecordID = 201,
                        TreatmentDate = new DateTime(2025, 1, 1),
                        Symptoms = "Pain",
                        Diagnosis = "Cavity",
                        Procedure = new Procedure { ProcedureName = "Filling" },
                        Dentist = new Dentist
                        {
                            User = new User { Fullname = "Dr. Smith" }
                        }
                    }
                }
            };

            _repoMock.Setup(r => r.GetTaskByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(mockTask);

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.Equal("Progress A", result.ProgressName);
            Assert.Equal("Desc", result.Description);
            Assert.Equal("Pending", result.Status);
            Assert.Equal("09:00", result.StartTime);
            Assert.Equal("10:00", result.EndTime);
            Assert.Equal("Filling", result.ProcedureName);
            Assert.Equal("Dr. Smith", result.DentistName);
        }

        [Fact(DisplayName = "UTCID02 - User not logged in => throw MSG53")]
        public async System.Threading.Tasks.Task UTCID02_HttpContext_Null_Should_Throw()
        {
            // Arrange
            SetupHttpContext(null);
            var command = new ViewTaskDetailsCommand(taskId: 1);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
        }

        [Fact(DisplayName = "UTCID03 - Role not Assistant => throw MSG26")]
        public async System.Threading.Tasks.Task UTCID03_Invalid_Role_Should_Throw()
        {
            // Arrange
            SetupHttpContext("Receptionist");
            var command = new ViewTaskDetailsCommand(taskId: 1);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID04 - Task not found => throw MSG16")]
        public async System.Threading.Tasks.Task UTCID04_Task_Not_Found_Should_Throw()
        {
            // Arrange
            SetupHttpContext("Assistant", "5");
            var command = new ViewTaskDetailsCommand(taskId: 99);

            _repoMock.Setup(r => r.GetTaskByIdAsync(99, It.IsAny<CancellationToken>()))
                .ReturnsAsync((Task?)null);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
        }

        [Fact(DisplayName = "UTCID05 - Task assigned to another assistant => throw MSG26")]
        public async System.Threading.Tasks.Task UTCID05_Task_Belongs_To_Other_Should_Throw()
        {
            // Arrange
            SetupHttpContext("Assistant", "5");
            var command = new ViewTaskDetailsCommand(taskId: 2);

            var mockTask = new Task
            {
                TaskID = 2,
                AssistantID = 99, // khác assistant
                TreatmentProgress = new TreatmentProgress
                {
                    TreatmentRecord = new TreatmentRecord()
                }
            };

            _repoMock.Setup(r => r.GetTaskByIdAsync(2, It.IsAny<CancellationToken>()))
                .ReturnsAsync(mockTask);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID06 - Task or progress or record is null => throw MSG16")]
        public async System.Threading.Tasks.Task UTCID06_Task_Missing_Data_Should_Throw()
        {
            // Arrange
            SetupHttpContext("Assistant", "5");
            var command = new ViewTaskDetailsCommand(taskId: 3);

            var mockTask = new Task
            {
                TaskID = 3,
                AssistantID = 5,
                TreatmentProgress = null // thiếu progress
            };

            _repoMock.Setup(r => r.GetTaskByIdAsync(3, It.IsAny<CancellationToken>()))
                .ReturnsAsync(mockTask);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
        }
    }
}
