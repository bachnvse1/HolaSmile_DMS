using Application.Interfaces;
using Application.Usecases.SendNotification;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.UserCommon.ReceiveNotification;

public class SendNotificationHandlerTests
{
    private readonly Mock<IUserCommonRepository> _userRepoMock = new();
    private readonly Mock<INotificationsRepository> _notificationRepoMock = new();
    private readonly SendNotificationHandler _handler;

    private Notification? _capturedNotification;

    public SendNotificationHandlerTests()
    {
        var serviceProviderMock = new Mock<IServiceProvider>();
        serviceProviderMock.Setup(x => x.GetService(typeof(IUserCommonRepository)))
            .Returns(_userRepoMock.Object);
        serviceProviderMock.Setup(x => x.GetService(typeof(INotificationsRepository)))
            .Returns(_notificationRepoMock.Object);

        var scopeMock = new Mock<IServiceScope>();
        scopeMock.Setup(x => x.ServiceProvider).Returns(serviceProviderMock.Object);

        var scopeFactoryMock = new Mock<IServiceScopeFactory>();
        scopeFactoryMock.Setup(x => x.CreateScope()).Returns(scopeMock.Object);

        _notificationRepoMock
            .Setup(r => r.SendNotificationAsync(It.IsAny<Notification>(), default))
            .Callback<Notification, CancellationToken>((n, _) => _capturedNotification = n)
            .Returns(System.Threading.Tasks.Task.CompletedTask);

        _handler = new SendNotificationHandler(scopeFactoryMock.Object);
    }

    [Fact] // UTCID01
    public async System.Threading.Tasks.Task Should_Send_Correct_Notification_To_ValidUser()
    {
        _userRepoMock.Setup(r => r.GetByIdAsync(10, default))
            .ReturnsAsync(new User { UserID = 10 });

        var cmd = new SendNotificationCommand(10, "Test title", "Test message", "Info", 123);

        await _handler.Handle(cmd, default);

        Assert.NotNull(_capturedNotification);
        Assert.Equal(10, _capturedNotification!.UserId);
        Assert.Equal("Test title", _capturedNotification.Title);
        Assert.Equal("Test message", _capturedNotification.Message);
        Assert.Equal("Info", _capturedNotification.Type);
        Assert.False(_capturedNotification.IsRead);
        Assert.Equal(123, _capturedNotification.RelatedObjectId);
        Assert.True((DateTime.Now - _capturedNotification.CreatedAt).TotalSeconds < 3);
    }

    [Fact] // UTCID02
    public async System.Threading.Tasks.Task Should_Throw_When_User_Not_Exist()
    {
        _userRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<int>(), default))
            .ReturnsAsync((User)null!);

        var cmd = new SendNotificationCommand(999, "Title", "Message", "Error", null);

        await Assert.ThrowsAsync<KeyNotFoundException>(() => _handler.Handle(cmd, default));
    }

    [Fact] // UTCID03
    public async System.Threading.Tasks.Task Should_Allow_Empty_Title()
    {
        _userRepoMock.Setup(r => r.GetByIdAsync(1, default))
            .ReturnsAsync(new User());

        var cmd = new SendNotificationCommand(1, "", "Content", "Reminder", null);
        await _handler.Handle(cmd, default);

        Assert.Equal("", _capturedNotification!.Title);
    }

    [Fact] // UTCID04
    public async System.Threading.Tasks.Task Should_Allow_Empty_Message()
    {
        _userRepoMock.Setup(r => r.GetByIdAsync(2, default))
            .ReturnsAsync(new User());

        var cmd = new SendNotificationCommand(2, "Alert", "", "Reminder", null);
        await _handler.Handle(cmd, default);

        Assert.Equal("", _capturedNotification!.Message);
    }

    [Fact] // UTCID05
    public async System.Threading.Tasks.Task Should_Allow_Null_RelatedObjectId()
    {
        _userRepoMock.Setup(r => r.GetByIdAsync(3, default))
            .ReturnsAsync(new User());

        var cmd = new SendNotificationCommand(3, "No Related", "Still valid", "Alert", null);
        await _handler.Handle(cmd, default);

        Assert.Null(_capturedNotification!.RelatedObjectId);
    }

    [Fact] // UTCID06
    public async System.Threading.Tasks.Task Should_Set_IsRead_To_False()
    {
        _userRepoMock.Setup(r => r.GetByIdAsync(4, default))
            .ReturnsAsync(new User());

        var cmd = new SendNotificationCommand(4, "T", "M", "Info", null);
        await _handler.Handle(cmd, default);

        Assert.False(_capturedNotification!.IsRead);
    }

    [Fact] // UTCID07
    public async System.Threading.Tasks.Task Should_Set_CreatedAt_To_CurrentTime()
    {
        _userRepoMock.Setup(r => r.GetByIdAsync(5, default))
            .ReturnsAsync(new User());

        var before = DateTime.Now;
        var cmd = new SendNotificationCommand(5, "Now", "Check time", "Info", null);
        await _handler.Handle(cmd, default);
        var after = DateTime.Now;

        Assert.InRange(_capturedNotification!.CreatedAt, before.AddSeconds(-1), after.AddSeconds(1));
    }
}