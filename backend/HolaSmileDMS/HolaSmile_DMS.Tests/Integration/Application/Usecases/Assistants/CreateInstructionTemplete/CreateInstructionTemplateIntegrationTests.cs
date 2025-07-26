using System.Security.Claims;
using Application.Constants;
using Application.Usecases.Assistants.CreateInstructionTemplete;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants;

public class CreateInstructionTemplateIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CreateInstructionTemplateIntegrationTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase("InstructionTemplateDb")
            .Options;

        _context = new ApplicationDbContext(options);
        _httpContextAccessor = new HttpContextAccessor();
    }

    private void SetupHttpContext(string role, string userId)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId)
        };
        var identity = new ClaimsIdentity(claims);
        var user = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = user };
        _httpContextAccessor.HttpContext = httpContext;
    }

    [Fact]
    public async System.Threading.Tasks.Task ITCID01_Should_CreateSuccessfully()
    {
        SetupHttpContext("Assistant", "101");
        var handler = new CreateInstructionTemplateHandler(
            new InstructionTemplateRepository(_context), _httpContextAccessor);

        var command = new CreateInstructionTemplateCommand
        {
            Instruc_TemplateName = "Mẫu",
            Instruc_TemplateContext = "Dặn dò"
        };

        var result = await handler.Handle(command, default);

        Assert.Equal(MessageConstants.MSG.MSG114, result);
        var data = await _context.InstructionTemplates.FirstOrDefaultAsync(x => x.CreateBy == 101);
        Assert.NotNull(data);
    }

    [Fact]
    public async System.Threading.Tasks.Task ITCID02_Should_OK_WhenDentist()
    {
        SetupHttpContext("Dentist", "102");
        var handler = new CreateInstructionTemplateHandler(
            new InstructionTemplateRepository(_context), _httpContextAccessor);

        var command = new CreateInstructionTemplateCommand
        {
            Instruc_TemplateName = "Tên",
            Instruc_TemplateContext = "Nội dung"
        };

        var result = await handler.Handle(command, default);
        Assert.Equal(MessageConstants.MSG.MSG114, result);
        var data = await _context.InstructionTemplates.FirstOrDefaultAsync(x => x.CreateBy == 102);
        Assert.NotNull(data);
    }

    [Fact]
    public async System.Threading.Tasks.Task ITCID03_Should_Throw_WhenTemplateNameIsEmpty()
    {
        SetupHttpContext("Assistant", "103");
        var handler = new CreateInstructionTemplateHandler(
            new InstructionTemplateRepository(_context), _httpContextAccessor);

        var command = new CreateInstructionTemplateCommand
        {
            Instruc_TemplateName = "",
            Instruc_TemplateContext = "Nội dung"
        };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task ITCID04_Should_Throw_WhenTemplateContextIsNull()
    {
        SetupHttpContext("Assistant", "104");
        var handler = new CreateInstructionTemplateHandler(
            new InstructionTemplateRepository(_context), _httpContextAccessor);

        var command = new CreateInstructionTemplateCommand
        {
            Instruc_TemplateName = "Tên",
            Instruc_TemplateContext = null
        };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task ITCID05_Should_StoreCorrectData()
    {
        SetupHttpContext("Assistant", "105");
        var handler = new CreateInstructionTemplateHandler(
            new InstructionTemplateRepository(_context), _httpContextAccessor);

        var command = new CreateInstructionTemplateCommand
        {
            Instruc_TemplateName = "Kiểm tra DB",
            Instruc_TemplateContext = "Nội dung DB"
        };

        await handler.Handle(command, default);

        var template = await _context.InstructionTemplates.FirstOrDefaultAsync(x => x.CreateBy == 105);
        Assert.NotNull(template);
        Assert.Equal("Kiểm tra DB", template.Instruc_TemplateName);
        Assert.Equal("Nội dung DB", template.Instruc_TemplateContext);
        Assert.False(template.IsDeleted);
    }
}