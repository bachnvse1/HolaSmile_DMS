using Application.Constants;
using Application.Usecases.Dentist.AssignTasksToAssistantHandler;
using Domain.Entities;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Application.Interfaces;
using MediatR;
using Xunit;
using Application.Usecases.SendNotification;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Dentists;

public class AssignTaskToAssistantHandlerTests
{
    private readonly Mock<ITaskRepository> _taskRepoMock;
    private readonly Mock<IHttpContextAccessor> _httpContextMock;
    private readonly Mock<IMediator> _mediatorMock;
    private readonly Mock<IUserCommonRepository> _userCommonRepoMock;

    public AssignTaskToAssistantHandlerTests()
    {
        _taskRepoMock = new Mock<ITaskRepository>();
        _httpContextMock = new Mock<IHttpContextAccessor>();
        _mediatorMock = new Mock<IMediator>();
        _userCommonRepoMock = new Mock<IUserCommonRepository>();
    }

    private AssignTaskToAssistantHandler CreateHandler(string role, string userId = "1")
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId)
        };

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        var context = new DefaultHttpContext { User = principal };

        _httpContextMock.Setup(x => x.HttpContext).Returns(context);

        return new AssignTaskToAssistantHandler(
            _taskRepoMock.Object,
            _httpContextMock.Object,
            _mediatorMock.Object,
            _userCommonRepoMock.Object
        );
    }

    [Fact(DisplayName = "[Integration - ITCID01 - Normal] Valid input should assign task successfully")]
    public async System.Threading.Tasks.Task ValidInput_ShouldReturnSuccessMessage()
    {
        // Arrange
        var command = new AssignTaskToAssistantCommand
        {
            AssistantId = 2,
            TreatmentProgressId = 1,
            ProgressName = "Giao việc ABC",
            Description = "Chuẩn bị dụng cụ",
            Status = true,
            StartTime = "09:00",
            EndTime = "10:00"
        };

        var treatmentProgress = new TreatmentProgress
        {
            TreatmentProgressID = 1,
            EndTime = DateTime.Today.AddHours(11)
        };

        _taskRepoMock.Setup(x => x.GetTreatmentProgressByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(treatmentProgress);

        _taskRepoMock.Setup(x => x.CreateTaskAsync(It.IsAny<Task>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _userCommonRepoMock.Setup(x => x.GetUserIdByRoleTableIdAsync("assistant", 2))
            .ReturnsAsync(99);

        var handler = CreateHandler("Dentist");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().Be(MessageConstants.MSG.MSG46);
        _taskRepoMock.Verify(x => x.CreateTaskAsync(It.IsAny<Task>(), It.IsAny<CancellationToken>()), Times.Once);
        _mediatorMock.Verify(x => x.Send(It.IsAny<SendNotificationCommand>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact(DisplayName = "[Integration - ITCID02 - Abnormal] Non-dentist role should throw unauthorized")]
    public async System.Threading.Tasks.Task NonDentistRole_ShouldThrowUnauthorized()
    {
        var command = new AssignTaskToAssistantCommand
        {
            AssistantId = 1,
            TreatmentProgressId = 1,
            StartTime = "09:00",
            EndTime = "10:00"
        };

        var handler = CreateHandler("Receptionist");

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(command, CancellationToken.None));
        ex.Message.Should().Be(MessageConstants.MSG.MSG26);
    }

    [Fact(DisplayName = "[Integration - ITCID03 - Abnormal] StartTime wrong format should throw")]
    public async System.Threading.Tasks.Task InvalidStartTimeFormat_ShouldThrowFormatException()
    {
        var command = new AssignTaskToAssistantCommand
        {
            AssistantId = 1,
            TreatmentProgressId = 1,
            StartTime = "abc",
            EndTime = "10:00"
        };

        var handler = CreateHandler("Dentist");

        await Assert.ThrowsAsync<FormatException>(() => handler.Handle(command, CancellationToken.None));
    }

    [Fact(DisplayName = "[Integration - ITCID04 - Abnormal] EndTime earlier than StartTime should throw")]
    public async System.Threading.Tasks.Task EndTimeBeforeStartTime_ShouldThrowInvalidOperationException()
    {
        var command = new AssignTaskToAssistantCommand
        {
            AssistantId = 1,
            TreatmentProgressId = 1,
            StartTime = "10:00",
            EndTime = "09:00"
        };

        var handler = CreateHandler("Dentist");

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => handler.Handle(command, CancellationToken.None));
        ex.Message.Should().Be("Thời gian kết thúc phải sau thời gian bắt đầu.");
    }

    [Fact(DisplayName = "[Integration - ITCID05 - Abnormal] Treatment progress not found should throw")]
    public async System.Threading.Tasks.Task ProgressNotFound_ShouldThrowKeyNotFound()
    {
        var command = new AssignTaskToAssistantCommand
        {
            AssistantId = 1,
            TreatmentProgressId = 999,
            StartTime = "09:00",
            EndTime = "10:00"
        };

        _taskRepoMock.Setup(x => x.GetTreatmentProgressByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TreatmentProgress?)null);

        var handler = CreateHandler("Dentist");

        var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() => handler.Handle(command, CancellationToken.None));
        ex.Message.Should().Be(MessageConstants.MSG.MSG16);
    }

    [Fact(DisplayName = "[Integration - ITCID06 - Abnormal] Progress has no EndTime should throw")]
    public async System.Threading.Tasks.Task ProgressWithoutEndTime_ShouldThrow()
    {
        var command = new AssignTaskToAssistantCommand
        {
            AssistantId = 1,
            TreatmentProgressId = 1,
            StartTime = "09:00",
            EndTime = "10:00"
        };

        _taskRepoMock.Setup(x => x.GetTreatmentProgressByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TreatmentProgress { TreatmentProgressID = 1, EndTime = null });

        var handler = CreateHandler("Dentist");

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => handler.Handle(command, CancellationToken.None));
        ex.Message.Should().Be("Tiến trình chưa có thời gian kết thúc cụ thể.");
    }

    [Fact(DisplayName = "[Integration - ITCID07 - Abnormal] Task time exceeds progress EndTime should throw")]
    public async System.Threading.Tasks.Task TaskTimeExceedsProgressEndTime_ShouldThrow()
    {
        var command = new AssignTaskToAssistantCommand
        {
            AssistantId = 1,
            TreatmentProgressId = 1,
            StartTime = "10:00",
            EndTime = "12:00"
        };

        _taskRepoMock.Setup(x => x.GetTreatmentProgressByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TreatmentProgress
            {
                TreatmentProgressID = 1,
                EndTime = DateTime.Today.AddHours(11) // 11:00
            });

        var handler = CreateHandler("Dentist");

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => handler.Handle(command, CancellationToken.None));
        ex.Message.Should().Be(MessageConstants.MSG.MSG92);
    }

    [Fact(DisplayName = "[Integration - ITCID08 - Abnormal] TaskRepository fails should return failure message")]
    public async System.Threading.Tasks.Task TaskCreationFails_ShouldReturnFailureMessage()
    {
        var command = new AssignTaskToAssistantCommand
        {
            AssistantId = 1,
            TreatmentProgressId = 1,
            ProgressName = "Test",
            Description = "Test",
            Status = true,
            StartTime = "09:00",
            EndTime = "10:00"
        };

        _taskRepoMock.Setup(x => x.GetTreatmentProgressByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TreatmentProgress { TreatmentProgressID = 1, EndTime = DateTime.Today.AddHours(11) });

        _taskRepoMock.Setup(x => x.CreateTaskAsync(It.IsAny<Task>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var handler = CreateHandler("Dentist");

        var result = await handler.Handle(command, CancellationToken.None);

        result.Should().Be(MessageConstants.MSG.MSG58);
    }
}
