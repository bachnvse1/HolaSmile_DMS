using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistants.EditInstructionTemplate;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants;

public class EditInstructionTemplateHandlerTests
{
    private readonly Mock<IInstructionTemplateRepository> _repoMock = new();
    private readonly Mock<IHttpContextAccessor> _httpContextAccessor = new();
    private readonly EditInstructionTemplateHandler _handler;

    public EditInstructionTemplateHandlerTests()
    {
        _handler = new EditInstructionTemplateHandler(_repoMock.Object, _httpContextAccessor.Object);
    }

    private void SetupHttpContext(string role = "Assistant", string userId = "1")
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId)
        };
        var context = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity(claims)) };
        _httpContextAccessor.Setup(x => x.HttpContext).Returns(context);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID01_ShouldOK_WhenRoleDentist()
    {
        SetupHttpContext("Dentist", "2");
        var template = new InstructionTemplate { Instruc_TemplateID = 1, Instruc_TemplateName = "New", Instruc_TemplateContext = "Context", IsDeleted = false };
        _repoMock.Setup(r => r.GetByIdAsync(1, new CancellationToken())).ReturnsAsync(template);
        _repoMock.Setup(r => r.UpdateAsync(It.IsAny<InstructionTemplate>())).Returns(System.Threading.Tasks.Task.CompletedTask);
        var command = new EditInstructionTemplateCommand { Instruc_TemplateID = 1, Instruc_TemplateName = "New", Instruc_TemplateContext = "Context" };
        var ok = await _handler.Handle(command, default);
        Assert.Equal(MessageConstants.MSG.MSG107, ok);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID02_ShouldThrow_WhenTemplateNotFound()
    {
        SetupHttpContext();
        _repoMock.Setup(r => r.GetByIdAsync(1, new CancellationToken())).ReturnsAsync((InstructionTemplate)null);

        var command = new EditInstructionTemplateCommand { Instruc_TemplateID = 1 };
        var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG115, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID03_ShouldThrow_WhenTemplateIsDeleted()
    {
        SetupHttpContext();
        _repoMock.Setup(r => r.GetByIdAsync(1, new CancellationToken())).ReturnsAsync(new InstructionTemplate { IsDeleted = true });

        var command = new EditInstructionTemplateCommand { Instruc_TemplateID = 1 };
        var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG115, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID04_ShouldUpdateSuccessfully()
    {
        SetupHttpContext("Assistant", "10");
        var template = new InstructionTemplate { Instruc_TemplateID = 1, Instruc_TemplateName = "Old", Instruc_TemplateContext = "Old", IsDeleted = false };

        _repoMock.Setup(r => r.GetByIdAsync(1, new CancellationToken())).ReturnsAsync(template);
        _repoMock.Setup(r => r.UpdateAsync(It.IsAny<InstructionTemplate>())).Returns(System.Threading.Tasks.Task.CompletedTask);

        var command = new EditInstructionTemplateCommand
        {
            Instruc_TemplateID = 1,
            Instruc_TemplateName = "New Name",
            Instruc_TemplateContext = "New Context"
        };

        var result = await _handler.Handle(command, default);

        Assert.Equal("New Name", template.Instruc_TemplateName);
        Assert.Equal("New Context", template.Instruc_TemplateContext);
        Assert.Equal(10, template.UpdatedBy);
        Assert.Equal(MessageConstants.MSG.MSG107, result);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID05_ShouldSetUpdatedAtCorrectly()
    {
        SetupHttpContext("Assistant", "99");
        var template = new InstructionTemplate { Instruc_TemplateID = 1, IsDeleted = false };
        _repoMock.Setup(r => r.GetByIdAsync(1, new CancellationToken())).ReturnsAsync(template);
        _repoMock.Setup(r => r.UpdateAsync(It.IsAny<InstructionTemplate>())).Returns(System.Threading.Tasks.Task.CompletedTask);

        var command = new EditInstructionTemplateCommand
        {
            Instruc_TemplateID = 1,
            Instruc_TemplateName = "New",
            Instruc_TemplateContext = "Context"
        };

        var result = await _handler.Handle(command, default);

        Assert.Equal(99, template.UpdatedBy);
        Assert.True(template.UpdatedAt > DateTime.UtcNow.AddMinutes(-1));
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID06_ShouldCall_UpdateAsync_Once()
    {
        SetupHttpContext("Assistant", "1");
        var template = new InstructionTemplate { Instruc_TemplateID = 1, IsDeleted = false };

        _repoMock.Setup(r => r.GetByIdAsync(1, new CancellationToken())).ReturnsAsync(template);
        _repoMock.Setup(r => r.UpdateAsync(template)).Returns(System.Threading.Tasks.Task.CompletedTask).Verifiable();

        var command = new EditInstructionTemplateCommand
        {
            Instruc_TemplateID = 1,
            Instruc_TemplateName = "Name",
            Instruc_TemplateContext = "Content"
        };

        await _handler.Handle(command, default);
        _repoMock.Verify(r => r.UpdateAsync(template), Times.Once);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID07_ShouldThrow_WhenHttpContextIsNull()
    {
        _httpContextAccessor.Setup(x => x.HttpContext).Returns<HttpContext>(null);

        var command = new EditInstructionTemplateCommand { Instruc_TemplateID = 1, Instruc_TemplateName = "X", Instruc_TemplateContext = "Y" };
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));

        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }
}