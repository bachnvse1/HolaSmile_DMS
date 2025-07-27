using Application.Interfaces;
using Application.Usecases.SendNotification;
using AutoMapper;
using HDMS_API.Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Infrastructure.Hubs;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.UserCommon;

public class SendNotificationHandlerIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly SendNotificationHandler _handler;

    public SendNotificationHandlerIntegrationTests()
    {
        var services = new ServiceCollection();

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase("SendNotificationTestDb"));

        services.AddMemoryCache();

        // Mock EmailService
        services.AddScoped<IEmailService, MockEmailService>();

        // Mock IMapper
        services.AddScoped<IMapper>(_ =>
        {
            var mockMapper = new Mock<IMapper>();
            mockMapper.Setup(m => m.Map<NotificationDto>(It.IsAny<Notification>()))
                      .Returns((Notification n) => new NotificationDto(
                          n.NotificationId,
                          n.Title,
                          n.Message,
                          n.Type,
                          n.IsRead,
                          n.CreatedAt,
                          n.RelatedObjectId,
                          n.MappingUrl
                      ));
            return mockMapper.Object;
        });
        var mockClientProxy = new Mock<IClientProxy>();
        mockClientProxy
            .As<IClientProxy>()
            .Setup(c => c.SendCoreAsync(
                "ReceiveNotification",
                It.Is<object[]>(args => args != null && args.Length == 1),
                It.IsAny<CancellationToken>())
            )
            .Returns(System.Threading.Tasks.Task.CompletedTask);

        var mockClients = new Mock<IHubClients>();
        mockClients
            .Setup(c => c.User(It.IsAny<string>()))
            .Returns(mockClientProxy.Object);

        var mockHubContext = new Mock<IHubContext<NotifyHub>>();
        mockHubContext
            .Setup(h => h.Clients)
            .Returns(mockClients.Object);

        services.AddSingleton(mockHubContext.Object);


// Đăng ký
        services.AddSingleton<IHubContext<NotifyHub>>(mockHubContext.Object);

        // Mock HubContex

        // Register Repos and Handler
        services.AddScoped<IUserCommonRepository, UserCommonRepository>();
        services.AddScoped<INotificationsRepository, NotificationsRepository>();
        services.AddScoped<SendNotificationHandler>();

        var provider = services.BuildServiceProvider();

        _context = provider.GetRequiredService<ApplicationDbContext>();
        SeedUsers(); // Reset DB và seed

        var scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();
        _handler = new SendNotificationHandler(scopeFactory);
    }

    private void SeedUsers()
    {
        _context.Database.EnsureDeleted();  // Tránh lỗi trùng khóa
        _context.Database.EnsureCreated();

        _context.Users.AddRange(
            new User { UserID = 10, Username = "user10", Phone = "03335389123" },
            new User { UserID = 11, Username = "user11", Phone = "03335389124" },
            new User { UserID = 12, Username = "user12", Phone = "03335389125" },
            new User { UserID = 13, Username = "user13", Phone = "03335389126" }
        );
        _context.SaveChanges();
    }

    private class MockEmailService : IEmailService
    {
        public System.Threading.Tasks.Task SendAsync(string to, string subject, string body) => System.Threading.Tasks.Task.CompletedTask;
        public System.Threading.Tasks.Task<string> GenerateOTP() => System.Threading.Tasks.Task.FromResult("123456");
        public System.Threading.Tasks.Task<bool> SendEmailAsync(string toEmail, string message, string subject) => System.Threading.Tasks.Task.FromResult(true);
        public System.Threading.Tasks.Task<bool> SendPasswordAsync(string toEmail, string password) => System.Threading.Tasks.Task.FromResult(true);
    }

    [Fact(DisplayName = "ITCID01 - Should send notification to valid user")]
    [Trait("TestType", "Integration")]
    public async System.Threading.Tasks.Task ITCID01_Send_Valid_Notification()
    {
        var cmd = new SendNotificationCommand(10, "Title", "Message", "Info", 123, "");
        await _handler.Handle(cmd, default);

        var noti = _context.Notifications.FirstOrDefault(n => n.UserId == 10);
        Assert.NotNull(noti);
        Assert.Equal("Title", noti!.Title);
        Assert.Equal("Message", noti.Message);
        Assert.Equal("Info", noti.Type);
        Assert.Equal(123, noti.RelatedObjectId);
    }

    [Fact(DisplayName = "ITCID02 - Should allow empty title")]
    [Trait("TestType", "Integration")]
    public async System.Threading.Tasks.Task ITCID02_Empty_Title()
    {
        var cmd = new SendNotificationCommand(11, "", "Hello", "Alert", null, "");
        await _handler.Handle(cmd, default);

        var noti = _context.Notifications.FirstOrDefault(n => n.UserId == 11);
        Assert.NotNull(noti);
        Assert.Equal("", noti!.Title);
    }

    [Fact(DisplayName = "ITCID03 - Should allow empty message")]
    [Trait("TestType", "Integration")]
    public async System.Threading.Tasks.Task ITCID03_Empty_Message()
    {
        var cmd = new SendNotificationCommand(12, "Note", "", "Reminder", null, "");
        await _handler.Handle(cmd, default);

        var noti = _context.Notifications.FirstOrDefault(n => n.UserId == 12);
        Assert.NotNull(noti);
        Assert.Equal("", noti!.Message);
    }

    [Fact(DisplayName = "ITCID04 - Should allow null RelatedObjectId")]
    [Trait("TestType", "Integration")]
    public async System.Threading.Tasks.Task ITCID04_Null_RelatedObjectId()
    {
        var cmd = new SendNotificationCommand(13, "Info", "Some note", "Warning", null, "");
        await _handler.Handle(cmd, default);

        var noti = _context.Notifications.FirstOrDefault(n => n.UserId == 13);
        Assert.NotNull(noti);
        Assert.Null(noti!.RelatedObjectId);
    }

    [Fact(DisplayName = "ITCID05 - Should throw when user not found")]
    [Trait("TestType", "Integration")]
    public async System.Threading.Tasks.Task ITCID05_User_Not_Found()
    {
        var cmd = new SendNotificationCommand(999, "T", "M", "Error", null, "");
        var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() => _handler.Handle(cmd, default));
        Assert.Equal("UserId 999 không tồn tại.", ex.Message);
    }
}
