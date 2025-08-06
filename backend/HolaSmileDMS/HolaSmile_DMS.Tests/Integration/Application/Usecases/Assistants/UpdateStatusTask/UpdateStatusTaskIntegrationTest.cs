using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.UpdateTaskStatus;
using Application.Usecases.SendNotification;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants
{
    public class UpdateTaskStatusIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly UpdateTaskStatusHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly Mock<IMediator> _mediatorMock;
        private readonly Mock<IUserCommonRepository> _userCommonRepositoryMock;

        public UpdateTaskStatusIntegrationTests()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("UpdateTaskStatusIntegrationTests"));

            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();

            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            _mediatorMock = new Mock<IMediator>();
            _userCommonRepositoryMock = new Mock<IUserCommonRepository>();

            // Thiết lập mock mặc định cho notification
            _mediatorMock.Setup(m => m.Send(It.IsAny<SendNotificationCommand>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MediatR.Unit.Value);

            _userCommonRepositoryMock.Setup(x => x.GetUserIdByRoleTableIdAsync(It.IsAny<string>(), It.IsAny<int>()))
                .ReturnsAsync(1);

            var taskRepository = new TaskRepository(_context);

            _handler = new UpdateTaskStatusHandler(
                taskRepository,
                _httpContextAccessor,
                _mediatorMock.Object,
                _userCommonRepositoryMock.Object);

            SeedData();
        }

        private void SetupHttpContext(string role, int roleTableId)
        {
            var context = new DefaultHttpContext();
            context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "1"),
                new Claim(ClaimTypes.Role, role),
                new Claim("role_table_id", roleTableId.ToString())
            }, "TestAuth"));

            _httpContextAccessor.HttpContext = context;
        }

        private void SeedData()
        {
            _context.Database.EnsureDeleted();
            _context.Database.EnsureCreated();

            // Thêm TreatmentProgress
            var treatmentProgress = new TreatmentProgress
            {
                TreatmentProgressID = 1,
                DentistID = 1,
                EndTime = DateTime.UtcNow.AddDays(7)
            };
            _context.TreatmentProgresses.Add(treatmentProgress);

            _context.Tasks.AddRange(
                new Task
                {
                    TaskID = 1,
                    AssistantID = 100,
                    TreatmentProgressID = 1,
                    Status = false,
                    ProgressName = "Task 1",
                    Description = "Task for assistant 100",
                    CreatedAt = DateTime.UtcNow
                },
                new Task
                {
                    TaskID = 2,
                    AssistantID = 200,
                    TreatmentProgressID = 1,
                    Status = false,
                    ProgressName = "Task 2",
                    Description = "Task for another assistant",
                    CreatedAt = DateTime.UtcNow
                }
            );

            _context.SaveChanges();
        }

        [Fact(DisplayName = "UTCID01 - Assistant updates own task successfully")]
        public async System.Threading.Tasks.Task UTCID01_UpdateOwnTask_Success()
        {
            // Arrange
            SetupHttpContext("Assistant", 100);

            var command = new UpdateTaskStatusCommand
            {
                TaskId = 1,
                Status = true
            };

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG97, result);

            var updatedTask = _context.Tasks.First(t => t.TaskID == 1);
            Assert.True(updatedTask.Status);

            // Verify notification was sent
            _mediatorMock.Verify(x => x.Send(
                It.Is<SendNotificationCommand>(n =>
                    n.UserId == 1 &&
                    n.Title == "Cập nhật trạng thái công việc trợ lý" &&  // Sửa lại title
                    n.Message == "Tiến trình: Task 1 - đã hoàn thành" &&
                    n.Type == "Update" &&
                    n.MappingUrl == "/dentist/assigned-tasks"),
                It.IsAny<CancellationToken>()
            ), Times.Once);
        }

        [Fact(DisplayName = "UTCID02 - Not logged in should throw MSG53")]
        public async System.Threading.Tasks.Task UTCID02_NotLoggedIn_Throws()
        {
            _httpContextAccessor.HttpContext = null;

            var command = new UpdateTaskStatusCommand
            {
                TaskId = 1,
                Status = true
            };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
        }

        [Fact(DisplayName = "UTCID03 - Role not Assistant should throw MSG26")]
        public async System.Threading.Tasks.Task UTCID03_NotAssistantRole_Throws()
        {
            SetupHttpContext("Dentist", 100);

            var command = new UpdateTaskStatusCommand
            {
                TaskId = 1,
                Status = true
            };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID04 - Task not found should throw MSG16")]
        public async System.Threading.Tasks.Task UTCID04_TaskNotFound_Throws()
        {
            SetupHttpContext("Assistant", 100);

            var command = new UpdateTaskStatusCommand
            {
                TaskId = 999,
                Status = true
            };

            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
        }

        [Fact(DisplayName = "UTCID05 - Task not belongs to assistant should throw MSG26")]
        public async System.Threading.Tasks.Task UTCID05_UpdateOtherAssistantTask_Throws()
        {
            SetupHttpContext("Assistant", 100);

            var command = new UpdateTaskStatusCommand
            {
                TaskId = 2,
                Status = true
            };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }
    }
}