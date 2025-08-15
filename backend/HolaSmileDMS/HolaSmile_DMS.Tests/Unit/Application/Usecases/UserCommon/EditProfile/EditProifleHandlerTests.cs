using Application.Constants;
using Application.Interfaces;
using HDMS_API.Application.Usecases.UserCommon.EditProfile;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using System.Security.Claims;
using System.Text;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.UserCommon;

public class EditProfileHandlerTests : IDisposable
{
    private readonly Mock<IUserCommonRepository> _repositoryMock;
    private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
    private readonly Mock<ICloudinaryService> _cloudinaryMock;
    private readonly IMemoryCache _memoryCache;
    private readonly EditProfileHandler _handler;
    private readonly string _testAvatarPath;

    public EditProfileHandlerTests()
    {
        _repositoryMock = new Mock<IUserCommonRepository>();
        _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
        _cloudinaryMock = new Mock<ICloudinaryService>();
        _memoryCache = new MemoryCache(new MemoryCacheOptions());

        _handler = new EditProfileHandler(
            _repositoryMock.Object,
            _httpContextAccessorMock.Object,
            _cloudinaryMock.Object,
            _memoryCache
        );

        // Tạo test file
        _testAvatarPath = Path.Combine(Path.GetTempPath(), $"test-avatar-{Guid.NewGuid()}.jpg");
        File.WriteAllText(_testAvatarPath, "fake image content");
    }

    private void SetupHttpContext(int userId)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        };

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        var context = new DefaultHttpContext { User = principal };

        _httpContextAccessorMock.Setup(h => h.HttpContext).Returns(context);
    }

    [Fact(DisplayName = "Success - UTCID01 - Should update profile without avatar")]
    public async System.Threading.Tasks.Task UTCID01_UpdateProfile_WithoutAvatar_Success()
    {
        // Arrange
        const int userId = 1;
        SetupHttpContext(userId);

        var user = new User
        {
            UserID = userId,
            Fullname = "Old Name",
            Gender = true,
            Address = "Old Address",
            DOB = "02/01/2003",
            Email = "old@mail.com"
        };

        _repositoryMock.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _repositoryMock.Setup(r => r.EditProfileAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var command = new EditProfileCommand
        {
            Fullname = "New Name",
            Gender = false,
            Address = "New Address",
            DOB = "01/01/2001",
            Avatar = null // Explicitly set null
            // Không đổi email ⇒ không cần token
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result);
        Assert.Equal("New Name", user.Fullname);
        Assert.False(user.Gender);
        Assert.Equal("New Address", user.Address);
        Assert.Equal("01/01/2001", user.DOB);
        Assert.NotNull(user.UpdatedAt);

        _cloudinaryMock.Verify(c => c.UploadImageAsync(
            It.IsAny<IFormFile>(), It.IsAny<string>()),
            Times.Never);
    }

    [Fact(DisplayName = "Success - UTCID02 - Should update profile with avatar")]
    public async System.Threading.Tasks.Task UTCID02_UpdateProfile_WithAvatar_Success()
    {
        // Arrange
        const int userId = 2;
        SetupHttpContext(userId);

        var user = new User { UserID = userId, Email = "u2@mail.com" };
        _repositoryMock.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _repositoryMock.Setup(r => r.EditProfileAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _cloudinaryMock.Setup(c => c.UploadImageAsync(It.IsAny<IFormFile>(), It.IsAny<string>()))
            .ReturnsAsync("new-avatar-url.jpg");

        // Create test FormFile
        var fileContent = "fake image content";
        var fileName = "test-avatar.jpg";
        var ms = new MemoryStream(Encoding.UTF8.GetBytes(fileContent));
        var formFile = new FormFile(ms, 0, ms.Length, "file", fileName)
        {
            Headers = new HeaderDictionary(),
            ContentType = "image/jpeg"
        };

        var command = new EditProfileCommand
        {
            Avatar = formFile
            // Không đổi email ⇒ không cần token
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result);
        Assert.Equal("new-avatar-url.jpg", user.Avatar);
        _cloudinaryMock.Verify(c => c.UploadImageAsync(
            It.Is<IFormFile>(f => f.FileName == fileName),
            It.Is<string>(s => s == "avatars")),
            Times.Once);
    }

    [Fact(DisplayName = "Error - UTCID03 - Should throw on invalid DOB format")]
    public async System.Threading.Tasks.Task UTCID03_InvalidDOB_ThrowsException()
    {
        // Arrange
        const int userId = 3;
        SetupHttpContext(userId);

        var user = new User { UserID = userId, Email = "u3@mail.com" };
        _repositoryMock.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var command = new EditProfileCommand { DOB = "invalid-date" };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<Exception>(
            () => _handler.Handle(command, CancellationToken.None));
        Assert.Equal(MessageConstants.MSG.MSG34, exception.Message);
    }

    [Fact(DisplayName = "Error - UTCID04 - Should throw when user not found")]
    public async System.Threading.Tasks.Task UTCID04_UserNotFound_ThrowsException()
    {
        // Arrange
        const int userId = 4;
        SetupHttpContext(userId);

        _repositoryMock.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        var command = new EditProfileCommand { Fullname = "Test" };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<Exception>(
            () => _handler.Handle(command, CancellationToken.None));
        Assert.Equal(MessageConstants.MSG.MSG16, exception.Message);
    }

    [Fact(DisplayName = "Error - UTCID05 - Should throw when save fails")]
    public async System.Threading.Tasks.Task UTCID05_SaveFails_ThrowsException()
    {
        // Arrange
        const int userId = 5;
        SetupHttpContext(userId);

        var user = new User { UserID = userId, Email = "u5@mail.com" };
        _repositoryMock.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _repositoryMock.Setup(r => r.EditProfileAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var command = new EditProfileCommand { Fullname = "Will Not Save" };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<Exception>(
            () => _handler.Handle(command, CancellationToken.None));
        Assert.Equal(MessageConstants.MSG.MSG58, exception.Message);
    }

    public void Dispose()
    {
        if (File.Exists(_testAvatarPath))
        {
            File.Delete(_testAvatarPath);
        }
    }
}
