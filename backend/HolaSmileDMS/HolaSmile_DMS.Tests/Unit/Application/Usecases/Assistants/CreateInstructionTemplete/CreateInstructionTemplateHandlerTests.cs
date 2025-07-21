using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistants.CreateInstructionTemplete;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants.CreateInstructionTemplete;

public class CreateInstructionTemplateHandlerTests
{
    private readonly Mock<IInstructionTemplateRepository> _repoMock;
    private readonly Mock<IHttpContextAccessor> _httpContextAccessor;
    private readonly CreateInstructionTemplateHandler _handler;

    public CreateInstructionTemplateHandlerTests()
    {
        _repoMock = new Mock<IInstructionTemplateRepository>();
        _httpContextAccessor = new Mock<IHttpContextAccessor>();
        _handler = new CreateInstructionTemplateHandler(_repoMock.Object, _httpContextAccessor.Object);
    }

    private void SetupHttpContext(string role = "Assistant", string userId = "1")
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId)
        };
        var identity = new ClaimsIdentity(claims);
        var principal = new ClaimsPrincipal(identity);
        var context = new DefaultHttpContext { User = principal };
        _httpContextAccessor.Setup(x => x.HttpContext).Returns(context);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID01_ShouldThrow_WhenRoleIsNotAssistant()
    {
        SetupHttpContext("Dentist");

        var cmd = new CreateInstructionTemplateCommand { Instruc_TemplateName = "Test", Instruc_TemplateContext = "Context" };

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(cmd, default));
        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID02_ShouldThrow_WhenTemplateNameIsNull()
    {
        SetupHttpContext();

        var cmd = new CreateInstructionTemplateCommand { Instruc_TemplateName = null, Instruc_TemplateContext = "Context" };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _handler.Handle(cmd, default));
        Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID03_ShouldThrow_WhenTemplateNameIsEmpty()
    {
        SetupHttpContext();

        var cmd = new CreateInstructionTemplateCommand { Instruc_TemplateName = "", Instruc_TemplateContext = "Context" };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _handler.Handle(cmd, default));
        Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID04_ShouldThrow_WhenTemplateContextIsNull()
    {
        SetupHttpContext();

        var cmd = new CreateInstructionTemplateCommand { Instruc_TemplateName = "Name", Instruc_TemplateContext = null };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _handler.Handle(cmd, default));
        Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID05_ShouldThrow_WhenTemplateContextIsWhitespace()
    {
        SetupHttpContext();

        var cmd = new CreateInstructionTemplateCommand { Instruc_TemplateName = "Name", Instruc_TemplateContext = "   " };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _handler.Handle(cmd, default));
        Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID06_ShouldCreateSuccessfully_WhenValidInput()
    {
        SetupHttpContext("Assistant", "99");

        var cmd = new CreateInstructionTemplateCommand
        {
            Instruc_TemplateName = "Test Name",
            Instruc_TemplateContext = "Test Context"
        };

        _repoMock.Setup(r => r.CreateAsync(It.IsAny<InstructionTemplate>())).Returns(System.Threading.Tasks.Task.CompletedTask);

        var result = await _handler.Handle(cmd, default);

        _repoMock.Verify(r => r.CreateAsync(It.Is<InstructionTemplate>(x =>
            x.Instruc_TemplateName == "Test Name" &&
            x.Instruc_TemplateContext == "Test Context" &&
            x.CreateBy == 99 &&
            !x.IsDeleted)), Times.Once);

        Assert.Equal(MessageConstants.MSG.MSG114, result);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID07_ShouldThrow_WhenHttpContextIsNull()
    {
        _httpContextAccessor.Setup(x => x.HttpContext).Returns<HttpContext>(null);

        var cmd = new CreateInstructionTemplateCommand
        {
            Instruc_TemplateName = "Any",
            Instruc_TemplateContext = "Any"
        };

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(cmd, default));
        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }
}