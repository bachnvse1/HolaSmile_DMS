using Application.Constants;
using Application.Interfaces;
using HDMS_API.Application.Interfaces;
using HDMS_API.Application.Usecases.UserCommon.EditProfile;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.UserCommon;

public class EditProfileHandlerIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly EditProfileHandler _handler;

    public EditProfileHandlerIntegrationTests()
    {
        var services = new ServiceCollection();

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase("EditProfileTestDb"));

        services.AddMemoryCache();
        services.AddHttpContextAccessor();

        var provider = services.BuildServiceProvider();

        _context = provider.GetRequiredService<ApplicationDbContext>();
        _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();
        var memoryCache = provider.GetRequiredService<IMemoryCache>();

        SeedData();

        var fileStorageMock = new Mock<IFileStorageService>();
        fileStorageMock.Setup(fs => fs.SaveAvatar(It.IsAny<string>())).Returns("stored-avatar.jpg");

        _handler = new EditProfileHandler(
            new UserCommonRepository(_context, new Mock<IEmailService>().Object),
            _httpContextAccessor,
            fileStorageMock.Object
        );
    }

    private void SeedData()
    {
        _context.Users.RemoveRange(_context.Users);
        _context.SaveChanges();

        _context.Users.Add(new User
        {
            UserID = 1,
            Username = "testuser",
            Fullname = "Nguyen Van A",
            Email = "test@example.com",
            Gender = true,
            Address = "Old Address",
            DOB = "01/01/2000",
            Avatar = "old-avatar.png",
            CreatedAt = DateTime.UtcNow,
            Phone = "0123456789"
        });


        _context.SaveChanges();
    }

    private void SetupHttpContext(int userId)
    {
        var context = new DefaultHttpContext();
        context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        }, "TestAuth"));

        _httpContextAccessor.HttpContext = context;
    }

    [Fact(DisplayName = "Normal - UTCID01 - Edit profile successfully")]
    [Trait("TestType", "Integration")]
    public async System.Threading.Tasks.Task UTCID01_EditProfile_Success()
    {
        // Arrange
        SetupHttpContext(1);

        var tempAvatarPath = Path.Combine(Path.GetTempPath(), "test-avatar.jpg");
        File.WriteAllText(tempAvatarPath, "fake image content"); // tạo file thật

        var command = new EditProfileCommand
        {
            Fullname = "Updated Name",
            Gender = false,
            Address = "New Address",
            DOB = "15/05/1995",
            Avatar = tempAvatarPath // đường dẫn hợp lệ
        };

        // Act
        var result = await _handler.Handle(command, default);

        // Assert
        Assert.True(result);
        var updated = _context.Users.Find(1);
        Assert.Equal("Updated Name", updated.Fullname);
        Assert.Equal("New Address", updated.Address);
        Assert.Equal("15/05/1995", updated.DOB);
        Assert.Equal("stored-avatar.jpg", updated.Avatar);

        File.Delete(tempAvatarPath); // dọn file test
    }


    [Fact(DisplayName = "Abnormal - UTCID02 - Edit profile with invalid DOB format should throw MSG34")]
    [Trait("TestType", "Integration")]
    public async System.Threading.Tasks.Task UTCID02_EditProfile_InvalidDOB_Throws()
    {
        SetupHttpContext(1);
        var command = new EditProfileCommand
        {
            DOB = "invalid-date"
        };

        var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG34, ex.Message);
    }

    [Fact(DisplayName = "Abnormal - UTCID03 - Edit profile with non-existent user should throw MSG16")]
    [Trait("TestType", "Integration")]
    public async System.Threading.Tasks.Task UTCID03_EditProfile_UserNotFound_Throws()
    {
        SetupHttpContext(999); // user không tồn tại
        var command = new EditProfileCommand
        {
            Fullname = "Will not update"
        };

        var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
    }

    [Fact(DisplayName = "Abnormal - UTCID04 - Edit profile failed to save should throw MSG58")]
    [Trait("TestType", "Integration")]
    public async System.Threading.Tasks.Task UTCID04_EditProfile_FailSave_Throws()
    {
        SetupHttpContext(1);

        var mockRepo = new Mock<IUserCommonRepository>();
        mockRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(_context.Users.Find(1));
        mockRepo.Setup(r => r.EditProfileAsync(It.IsAny<User>(), It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var handler = new EditProfileHandler(
            mockRepo.Object,
            _httpContextAccessor,
            new Mock<IFileStorageService>().Object
        );

        var command = new EditProfileCommand
        {
            Fullname = "Anything"
        };

        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG58, ex.Message);
    }
}
