using System.Security.Claims;
using Application.Interfaces;
using Application.Usecases.Assistants.ViewInstructionTemplateList;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants.ViewInstructionTemplateList;

public class ViewInstructionTemplateListHandlerTests
{
    private readonly Mock<IInstructionTemplateRepository> _repoMock = new();
    private readonly Mock<IUserCommonRepository> _userRepoMock = new();
    private readonly Mock<IHttpContextAccessor> _httpContextMock = new();
    private readonly ViewInstructionTemplateListHandler _handler;

    public ViewInstructionTemplateListHandlerTests()
    {
        _handler = new ViewInstructionTemplateListHandler(
            _repoMock.Object,
            _httpContextMock.Object,
            _userRepoMock.Object);
    }

    private void SetupHttpContext(string role = "Assistant")
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, "1")
        };
        var context = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity(claims)) };
        _httpContextMock.Setup(x => x.HttpContext).Returns(context);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID01_ShouldReturnEmptyList_WhenNoTemplatesExist()
    {
        SetupHttpContext();
        _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<InstructionTemplate>());

        var result = await _handler.Handle(new ViewInstructionTemplateListQuery(), default);

        Assert.Empty(result);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID02_ShouldIgnoreDeletedTemplates()
    {
        SetupHttpContext();
        var templates = new List<InstructionTemplate>
        {
            new() { Instruc_TemplateID = 1, Instruc_TemplateName = "A", Instruc_TemplateContext = "X", CreatedAt = DateTime.UtcNow, CreateBy = 1, IsDeleted = true }
        };
        _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(templates);

        var result = await _handler.Handle(new ViewInstructionTemplateListQuery(), default);

        Assert.Empty(result);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID03_ShouldMapCreateByNameCorrectly()
    {
        SetupHttpContext();
        _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<InstructionTemplate>
        {
            new() { Instruc_TemplateID = 1, Instruc_TemplateName = "A", Instruc_TemplateContext = "X", CreatedAt = DateTime.UtcNow, CreateBy = 1, IsDeleted = false }
        });
        _userRepoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User { Fullname = "Assistant A" });

        var result = await _handler.Handle(new ViewInstructionTemplateListQuery(), default);

        Assert.Single(result);
        Assert.Equal("Assistant A", result[0].CreateByName);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID04_ShouldReturnUpdateByName_WhenAvailable()
    {
        SetupHttpContext();
        _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<InstructionTemplate>
        {
            new() { Instruc_TemplateID = 1, Instruc_TemplateName = "A", Instruc_TemplateContext = "X", CreatedAt = DateTime.UtcNow, CreateBy = 1, UpdatedBy = 2, UpdatedAt = DateTime.UtcNow, IsDeleted = false }
        });
        _userRepoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User { Fullname = "Assistant A" });
        _userRepoMock.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User { Fullname = "Updater B" });

        var result = await _handler.Handle(new ViewInstructionTemplateListQuery(), default);

        Assert.Equal("Updater B", result[0].UpdateByName);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID05_ShouldReturnUpdateByName_NA_WhenNull()
    {
        SetupHttpContext();
        _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<InstructionTemplate>
        {
            new() { Instruc_TemplateID = 1, Instruc_TemplateName = "A", Instruc_TemplateContext = "X", CreatedAt = DateTime.UtcNow, CreateBy = 1, IsDeleted = false }
        });
        _userRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User { Fullname = "Creator A" });

        var result = await _handler.Handle(new ViewInstructionTemplateListQuery(), default);

        Assert.Equal("N/A", result[0].UpdateByName);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID06_ShouldReturnMultipleTemplates()
    {
        SetupHttpContext();
        var templates = new List<InstructionTemplate>
        {
            new() { Instruc_TemplateID = 1, Instruc_TemplateName = "A", Instruc_TemplateContext = "X", CreatedAt = DateTime.UtcNow, CreateBy = 1, IsDeleted = false },
            new() { Instruc_TemplateID = 2, Instruc_TemplateName = "B", Instruc_TemplateContext = "Y", CreatedAt = DateTime.UtcNow, CreateBy = 1, IsDeleted = false }
        };
        _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(templates);
        _userRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User { Fullname = "Assistant A" });

        var result = await _handler.Handle(new ViewInstructionTemplateListQuery(), default);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID07_ShouldHandleHttpContextNull()
    {
        _httpContextMock.Setup(x => x.HttpContext).Returns<HttpContext>(null);
        _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<InstructionTemplate>());

        var result = await _handler.Handle(new ViewInstructionTemplateListQuery(), default);

        Assert.Empty(result);
    }
}