using Application.Constants;
using Application.Interfaces;
using HDMS_API.Application.Usecases.UserCommon.EditProfile;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;


namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.UserCommon;

public class EditProfileHandlerTests
{
    private readonly Mock<IUserCommonRepository> _repositoryMock;
    private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
    private readonly Mock<IFileStorageService> _fileStorageServiceMock;
    private readonly EditProfileHandler _handler;

    public EditProfileHandlerTests()
    {
        _repositoryMock = new Mock<IUserCommonRepository>();
        _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
        _fileStorageServiceMock = new Mock<IFileStorageService>();

        _handler = new EditProfileHandler(
            _repositoryMock.Object,
            _httpContextAccessorMock.Object,
            _fileStorageServiceMock.Object
        );
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

    [Fact(DisplayName = "Normal - UTCID01 - Update profile successfully without avatar")]
    public async System.Threading.Tasks.Task UTCID01_Edit_Profile_Success_Without_Avatar()
    {
        int userId = 1;
        SetupHttpContext(userId);

        var user = new User { UserID = userId, Fullname = "Old Name", DOB = "02/01/2003" };

        _repositoryMock.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _repositoryMock.Setup(r => r.EditProfileAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var request = new EditProfileCommand
        {
            Fullname = "New Name",
            DOB = "01/01/2001"
        };

        var result = await _handler.Handle(request, default);

        Assert.True(result);
        Assert.Equal("New Name", user.Fullname);
        Assert.Equal("01/01/2001", user.DOB);
    }

    [Fact(DisplayName = "Normal - UTCID02 - Update profile with avatar successfully")]
    public async System.Threading.Tasks.Task UTCID02_Edit_Profile_Success_With_Avatar()
    {
        int userId = 2;
        SetupHttpContext(userId);

        var tempPath = Path.Combine(Path.GetTempPath(), Path.GetRandomFileName() + ".jpg");
        await File.WriteAllTextAsync(tempPath, "dummy-avatar-data");

        var user = new User { UserID = userId };

        _repositoryMock.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _repositoryMock.Setup(r => r.EditProfileAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _fileStorageServiceMock.Setup(s => s.SaveAvatar(It.IsAny<string>()))
            .Returns("saved_avatar_url");

        var request = new EditProfileCommand
        {
            Avatar = tempPath
        };

        var result = await _handler.Handle(request, default);

        Assert.True(result);
        Assert.Equal("saved_avatar_url", user.Avatar);

        File.Delete(tempPath); // Dọn dẹp sau khi test
    }



    [Fact(DisplayName = "Abnormal - UTCID03 - Invalid DOB format should throw MSG34")]
    public async System.Threading.Tasks.Task UTCID03_Edit_Profile_Invalid_DOB_Throws_MSG34()
    {
        int userId = 3;
        SetupHttpContext(userId);

        var user = new User { UserID = userId };

        _repositoryMock.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var request = new EditProfileCommand { DOB = "invalid-date" };

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            _handler.Handle(request, default));

        Assert.Equal(MessageConstants.MSG.MSG34, ex.Message);
    }

    [Fact(DisplayName = "Abnormal - UTCID04 - User not found should throw MSG16")]
    public async System.Threading.Tasks.Task UTCID04_Edit_Profile_User_Not_Found_Throws_MSG16()
    {
        int userId = 4;
        SetupHttpContext(userId);

        _repositoryMock.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        var request = new EditProfileCommand { Fullname = "Test" };

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            _handler.Handle(request, default));

        Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
    }

    [Fact(DisplayName = "Abnormal - UTCID05 - Repository fails to update should throw MSG58")]
    public async System.Threading.Tasks.Task UTCID05_Edit_Profile_Fail_To_Save_Throws_MSG58()
    {
        int userId = 5;
        SetupHttpContext(userId);

        var user = new User { UserID = userId };

        _repositoryMock.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _repositoryMock.Setup(r => r.EditProfileAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var request = new EditProfileCommand { Fullname = "Update Fail" };

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            _handler.Handle(request, default));

        Assert.Equal(MessageConstants.MSG.MSG58, ex.Message);
    }
}
