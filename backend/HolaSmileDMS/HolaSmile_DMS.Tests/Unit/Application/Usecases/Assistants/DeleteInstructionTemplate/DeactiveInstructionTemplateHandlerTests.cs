using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistants.DeleteInstructionTemplate;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants.DeleteInstructionTemplate;

public class DeactiveInstructionTemplateHandlerTests
{
    private readonly Mock<IInstructionTemplateRepository> _repoMock = new();
    private readonly Mock<IHttpContextAccessor> _httpContextMock = new();
    private readonly DeactiveInstructionTemplateHandler _handler;

    public DeactiveInstructionTemplateHandlerTests()
    {
        _handler = new DeactiveInstructionTemplateHandler(_repoMock.Object, _httpContextMock.Object);
    }

    private void SetupHttpContext(string role = "Assistant", string userId = "1")
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId)
        };
        var context = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity(claims)) };
        _httpContextMock.Setup(x => x.HttpContext).Returns(context);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID01_ShouldThrow_WhenRoleNotAssistant()
    {
        SetupHttpContext("Dentist");

        var command = new DeactiveInstructionTemplateCommand { Instruc_TemplateID = 1 };
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));

        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID02_ShouldThrow_WhenTemplateNotFound()
    {
        SetupHttpContext();
        _repoMock.Setup(r => r.GetByIdAsync(1, new CancellationToken())).ReturnsAsync((InstructionTemplate)null);

        var command = new DeactiveInstructionTemplateCommand { Instruc_TemplateID = 1 };
        var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));

        Assert.Equal(MessageConstants.MSG.MSG115, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID03_ShouldThrow_WhenTemplateAlreadyDeleted()
    {
        SetupHttpContext();
        var template = new InstructionTemplate { Instruc_TemplateID = 1, IsDeleted = true };
        _repoMock.Setup(r => r.GetByIdAsync(1, new CancellationToken())).ReturnsAsync(template);

        var command = new DeactiveInstructionTemplateCommand { Instruc_TemplateID = 1 };
        var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));

        Assert.Equal(MessageConstants.MSG.MSG115, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID04_ShouldDeactivateSuccessfully()
    {
        SetupHttpContext("Assistant", "10");
        var template = new InstructionTemplate { Instruc_TemplateID = 1, IsDeleted = false };
        _repoMock.Setup(r => r.GetByIdAsync(1, new CancellationToken())).ReturnsAsync(template);
        _repoMock.Setup(r => r.UpdateAsync(It.IsAny<InstructionTemplate>()))
            .Returns(System.Threading.Tasks.Task.CompletedTask);

        var command = new DeactiveInstructionTemplateCommand { Instruc_TemplateID = 1 };
        var result = await _handler.Handle(command, default);

        Assert.True(template.IsDeleted);
        Assert.Equal(10, template.UpdatedBy);
        Assert.True(template.UpdatedAt > DateTime.UtcNow.AddMinutes(-1));
        Assert.Equal(MessageConstants.MSG.MSG41, result);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID05_ShouldCallUpdateOnce()
    {
        SetupHttpContext();
        var template = new InstructionTemplate { Instruc_TemplateID = 1 };
        _repoMock.Setup(r => r.GetByIdAsync(1, new CancellationToken())).ReturnsAsync(template);
        _repoMock.Setup(r => r.UpdateAsync(template)).Returns(System.Threading.Tasks.Task.CompletedTask).Verifiable();

        var command = new DeactiveInstructionTemplateCommand { Instruc_TemplateID = 1 };
        await _handler.Handle(command, default);

        _repoMock.Verify(r => r.UpdateAsync(template), Times.Once);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID06_ShouldSet_UpdatedAt_And_UpdatedBy()
    {
        SetupHttpContext("Assistant", "99");
        var template = new InstructionTemplate { Instruc_TemplateID = 1, IsDeleted = false };
        _repoMock.Setup(r => r.GetByIdAsync(1, new CancellationToken())).ReturnsAsync(template);
        _repoMock.Setup(r => r.UpdateAsync(It.IsAny<InstructionTemplate>()))
            .Returns(System.Threading.Tasks.Task.CompletedTask);

        var command = new DeactiveInstructionTemplateCommand { Instruc_TemplateID = 1 };
        await _handler.Handle(command, default);

        Assert.Equal(99, template.UpdatedBy);
        Assert.True(template.UpdatedAt > DateTime.UtcNow.AddMinutes(-1));
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID07_ShouldThrow_WhenHttpContextIsNull()
    {
        _httpContextMock.Setup(x => x.HttpContext).Returns<HttpContext>(null);

        var command = new DeactiveInstructionTemplateCommand { Instruc_TemplateID = 1 };
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));

        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }
}