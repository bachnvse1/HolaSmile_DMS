//using Application.Constants;
//using Application.Interfaces;
//using HDMS_API.Application.Interfaces;
//using HDMS_API.Application.Usecases.UserCommon.EditProfile;
//using HDMS_API.Infrastructure.Persistence;
//using HDMS_API.Infrastructure.Repositories;
//using Microsoft.AspNetCore.Http;
//using Microsoft.EntityFrameworkCore;
//using Microsoft.Extensions.DependencyInjection;
//using Moq;
//using System.Security.Claims;
//using Xunit;

//namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.UserCommon;

//public class EditProfileHandlerIntegrationTests : IDisposable
//{
//    private readonly ApplicationDbContext _context;
//    private readonly IHttpContextAccessor _httpContextAccessor;
//    private readonly Mock<ICloudinaryService> _cloudinaryMock;
//    private readonly EditProfileHandler _handler;
//    private readonly string _testAvatarPath;

//    public EditProfileHandlerIntegrationTests()
//    {
//        var services = new ServiceCollection();
//        services.AddDbContext<ApplicationDbContext>(options =>
//            options.UseInMemoryDatabase(databaseName: $"EditProfileTestDb_{Guid.NewGuid()}"));
//        services.AddHttpContextAccessor();

//        var provider = services.BuildServiceProvider();
//        _context = provider.GetRequiredService<ApplicationDbContext>();
//        _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

//        // Setup CloudinaryService mock
//        _cloudinaryMock = new Mock<ICloudinaryService>();
//        _cloudinaryMock.Setup(cs => cs.UploadImageAsync(It.IsAny<IFormFile>(), It.IsAny<string>()))
//            .ReturnsAsync("new-avatar-url.jpg");

//        _handler = new EditProfileHandler(
//            new UserCommonRepository(_context),
//            _httpContextAccessor,
//            _cloudinaryMock.Object
//        );

//        // Create test avatar file
//        _testAvatarPath = Path.Combine(Path.GetTempPath(), $"test-avatar-{Guid.NewGuid()}.jpg");
//        File.WriteAllText(_testAvatarPath, "fake image content");

//        SeedData();
//    }

//    private void SeedData()
//    {
//        _context.Users.Add(new User
//        {
//            UserID = 1,
//            Username = "testuser",
//            Fullname = "Test User",
//            Email = "test@example.com",
//            Gender = true,
//            Address = "Test Address",
//            DOB = "01/01/2000",
//            Avatar = "old-avatar.jpg",
//            CreatedAt = DateTime.UtcNow,
//            Phone = "0123456789",
//            Status = true
//        });

//        _context.SaveChanges();
//    }

//    private void SetupHttpContext(int userId)
//    {
//        var context = new DefaultHttpContext();
//        context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
//        {
//            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
//        }));
//        _httpContextAccessor.HttpContext = context;
//    }

//    [Fact(DisplayName = "Success - UTCID01 - Should update all profile fields")]
//    [Trait("Category", "Integration")]
//    public async System.Threading.Tasks.Task UTCID01_UpdateAllFields_Success()
//    {
//        // Arrange
//        SetupHttpContext(1);
//        var avatarFile = new FormFile(
//            new MemoryStream(File.ReadAllBytes(_testAvatarPath)),
//            0, new FileInfo(_testAvatarPath).Length,
//            "Media", Path.GetFileName(_testAvatarPath));

//        var command = new EditProfileCommand
//        {
//            Fullname = "Updated Name",
//            Gender = false,
//            Address = "New Address",
//            DOB = "15/05/1995",
//            Avatar = avatarFile
//        };

//        // Act
//        var result = await _handler.Handle(command, CancellationToken.None);

//        // Assert
//        Assert.True(result);
//        var updated = await _context.Users.FindAsync(1);
//        Assert.NotNull(updated);
//        Assert.Equal("Updated Name", updated.Fullname);
//        Assert.False(updated.Gender);
//        Assert.Equal("New Address", updated.Address);
//        Assert.Equal("15/05/1995", updated.DOB);
//        Assert.Equal("new-avatar-url.jpg", updated.Avatar);
//        Assert.NotNull(updated.UpdatedAt);

//        _cloudinaryMock.Verify(c => c.UploadImageAsync(
//            It.IsAny<IFormFile>(),
//            It.Is<string>(s => s == "avatars")),
//            Times.Once);
//    }

//    [Fact(DisplayName = "Success - UTCID02 - Should update partial fields")]
//    [Trait("Category", "Integration")]
//    public async System.Threading.Tasks.Task UTCID02_UpdatePartialFields_Success()
//    {
//        // Arrange
//        SetupHttpContext(1);
//        var command = new EditProfileCommand
//        {
//            Fullname = "Updated Name",
//            // Other fields null - should not change
//        };

//        // Act
//        var result = await _handler.Handle(command, CancellationToken.None);

//        // Assert
//        Assert.True(result);
//        var updated = await _context.Users.FindAsync(1);
//        Assert.NotNull(updated);
//        Assert.Equal("Updated Name", updated.Fullname);
//        Assert.Equal("Test Address", updated.Address); // Unchanged
//        Assert.Equal("01/01/2000", updated.DOB); // Unchanged
//        Assert.Equal("old-avatar.jpg", updated.Avatar); // Unchanged
//        Assert.True(updated.Gender); // Unchanged
//    }

//    [Fact(DisplayName = "Error - UTCID03 - Should throw when user not found")]
//    [Trait("Category", "Integration")]
//    public async System.Threading.Tasks.Task UTCID03_UserNotFound_ThrowsException()
//    {
//        // Arrange
//        SetupHttpContext(999); // Non-existent user
//        var command = new EditProfileCommand
//        {
//            Fullname = "Will Not Update"
//        };

//        // Act & Assert
//        var exception = await Assert.ThrowsAsync<Exception>(
//            () => _handler.Handle(command, CancellationToken.None));
//        Assert.Equal(MessageConstants.MSG.MSG16, exception.Message);
//    }

//    [Fact(DisplayName = "Error - UTCID04 - Should throw on invalid DOB format")]
//    [Trait("Category", "Integration")]
//    public async System.Threading.Tasks.Task UTCID04_InvalidDOB_ThrowsException()
//    {
//        // Arrange
//        SetupHttpContext(1);
//        var command = new EditProfileCommand
//        {
//            DOB = "invalid-date"
//        };

//        // Act & Assert
//        var exception = await Assert.ThrowsAsync<Exception>(
//            () => _handler.Handle(command, CancellationToken.None));
//        Assert.Equal(MessageConstants.MSG.MSG34, exception.Message);
//    }

//    [Fact(DisplayName = "Error - UTCID05 - Should throw when save fails")]
//    [Trait("Category", "Integration")]
//    public async System.Threading.Tasks.Task UTCID05_SaveFails_ThrowsException()
//    {
//        // Arrange
//        SetupHttpContext(1);
//        var mockRepo = new Mock<IUserCommonRepository>();
//        mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
//            .ReturnsAsync(_context.Users.Find(1));
//        mockRepo.Setup(r => r.EditProfileAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
//            .ReturnsAsync(false);

//        var handler = new EditProfileHandler(
//            mockRepo.Object,
//            _httpContextAccessor,
//            _cloudinaryMock.Object
//        );

//        var command = new EditProfileCommand { Fullname = "Will Not Save" };

//        // Act & Assert
//        var exception = await Assert.ThrowsAsync<Exception>(
//            () => handler.Handle(command, CancellationToken.None));
//        Assert.Equal(MessageConstants.MSG.MSG58, exception.Message);
//    }

//    public void Dispose()
//    {
//        if (File.Exists(_testAvatarPath))
//        {
//            File.Delete(_testAvatarPath);
//        }
//        _context.Database.EnsureDeleted();
//        _context.Dispose();
//    }
//}