using System.Security.Claims;
using Application.Constants;
using Application.Usecases.Assistants.DeleteInstructionTemplate;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants.DeleteInstructionTemplate;

public class DeactiveInstructionTemplateIntegrationTests
{
    private readonly string _dbName = $"Db_{Guid.NewGuid()}";

    private void SetupHttpContext(IHttpContextAccessor accessor, string role, string userId)
    {
        accessor.HttpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, userId)
            }))
        };
    }

    private async System.Threading.Tasks.Task SeedTemplate(bool isDeleted = false)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(_dbName).Options;

        using var context = new ApplicationDbContext(options);
        context.InstructionTemplates.Add(new InstructionTemplate
        {
            Instruc_TemplateID = 1,
            Instruc_TemplateName = "Tên",
            Instruc_TemplateContext = "Nội dung",
            CreateBy = 1,
            CreatedAt = DateTime.UtcNow,
            IsDeleted = isDeleted
        });
        await context.SaveChangesAsync();
    }

    [Fact]
    public async System.Threading.Tasks.Task ITCID01_ShouldDeactivateSuccessfully()
    {
        await SeedTemplate();
        var handlerOptions = new DbContextOptionsBuilder<ApplicationDbContext>().UseInMemoryDatabase(_dbName).Options;
        var handlerContext = new ApplicationDbContext(handlerOptions);

        var accessor = new HttpContextAccessor();
        SetupHttpContext(accessor, "Assistant", "123");

        var handler = new DeactiveInstructionTemplateHandler(
            new InstructionTemplateRepository(handlerContext),
            accessor);

        var result = await handler.Handle(new DeactiveInstructionTemplateCommand { Instruc_TemplateID = 1 }, default);

        using var verifyContext = new ApplicationDbContext(handlerOptions);
        var template = await verifyContext.InstructionTemplates.FindAsync(1);

        Assert.True(template.IsDeleted);
        Assert.Equal(123, template.UpdatedBy);
        Assert.Equal(MessageConstants.MSG.MSG41, result);
    }

    [Fact]
    public async System.Threading.Tasks.Task ITCID02_ShouldThrow_WhenRoleNotAssistant()
    {
        await SeedTemplate();
        var context = new ApplicationDbContext(
            new DbContextOptionsBuilder<ApplicationDbContext>().UseInMemoryDatabase(_dbName).Options);

        var accessor = new HttpContextAccessor();
        SetupHttpContext(accessor, "Dentist", "1");

        var handler = new DeactiveInstructionTemplateHandler(
            new InstructionTemplateRepository(context),
            accessor);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(new DeactiveInstructionTemplateCommand { Instruc_TemplateID = 1 }, default));
    }

    [Fact]
    public async System.Threading.Tasks.Task ITCID03_ShouldThrow_WhenTemplateNotFound()
    {
        var context = new ApplicationDbContext(
            new DbContextOptionsBuilder<ApplicationDbContext>().UseInMemoryDatabase(_dbName).Options);

        var accessor = new HttpContextAccessor();
        SetupHttpContext(accessor, "Assistant", "1");

        var handler = new DeactiveInstructionTemplateHandler(
            new InstructionTemplateRepository(context),
            accessor);

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            handler.Handle(new DeactiveInstructionTemplateCommand { Instruc_TemplateID = 999 }, default));

        Assert.Equal(MessageConstants.MSG.MSG115, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task ITCID04_ShouldThrow_WhenTemplateAlreadyDeleted()
    {
        await SeedTemplate(isDeleted: true);
        var context = new ApplicationDbContext(
            new DbContextOptionsBuilder<ApplicationDbContext>().UseInMemoryDatabase(_dbName).Options);

        var accessor = new HttpContextAccessor();
        SetupHttpContext(accessor, "Assistant", "1");

        var handler = new DeactiveInstructionTemplateHandler(
            new InstructionTemplateRepository(context),
            accessor);

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            handler.Handle(new DeactiveInstructionTemplateCommand { Instruc_TemplateID = 1 }, default));

        Assert.Equal(MessageConstants.MSG.MSG115, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task ITCID05_ShouldPreserve_CreatedInfo_WhenDeactivated()
    {
        await SeedTemplate();
        var context = new ApplicationDbContext(
            new DbContextOptionsBuilder<ApplicationDbContext>().UseInMemoryDatabase(_dbName).Options);

        var accessor = new HttpContextAccessor();
        SetupHttpContext(accessor, "Assistant", "88");

        var handler = new DeactiveInstructionTemplateHandler(
            new InstructionTemplateRepository(context),
            accessor);

        await handler.Handle(new DeactiveInstructionTemplateCommand { Instruc_TemplateID = 1 }, default);

        var updated = await context.InstructionTemplates.FindAsync(1);

        Assert.Equal(1, updated.CreateBy);
        Assert.NotNull(updated.CreatedAt);
        Assert.Equal(88, updated.UpdatedBy);
    }
}