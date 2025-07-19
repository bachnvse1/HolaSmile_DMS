using System.Security.Claims;
using Application.Usecases.Assistants.ViewInstructionTemplateList;
using HDMS_API.Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using HDMS_API.Infrastructure.Services;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants.ViewInstructionTemplateList;

public class ViewInstructionTemplateListIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IMemoryCache _memoryCache;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ViewInstructionTemplateListIntegrationTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()) // Tạo DB mới mỗi lần
            .Options;

        _context = new ApplicationDbContext(options);
        _emailService = new EmailService(new Mock<IConfiguration>().Object);
        _memoryCache = new MemoryCache(new MemoryCacheOptions());
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
        _httpContextAccessor.HttpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(identity)
        };
    }

    private async System.Threading.Tasks.Task SeedDataAsync()
    {
        _context.Users.AddRange(
            new User { UserID = 1, Fullname = "Assistant A" , Phone = "1234567890", Username = "assistant_a" },
            new User { UserID = 2, Fullname = "Updater B",  Phone = "1234567890" , Username =  "updater_b" }
        );
        _context.InstructionTemplates.AddRange(
            new InstructionTemplate
            {
                Instruc_TemplateID = 1,
                Instruc_TemplateName = "Template 1",
                Instruc_TemplateContext = "Context 1",
                CreatedAt = DateTime.UtcNow,
                CreateBy = 1,
                UpdatedBy = 2,
                UpdatedAt = DateTime.UtcNow,
                IsDeleted = false
            },
            new InstructionTemplate
            {
                Instruc_TemplateID = 2,
                Instruc_TemplateName = "Template 2",
                Instruc_TemplateContext = "Context 2",
                CreatedAt = DateTime.UtcNow,
                CreateBy = 1,
                IsDeleted = true // Deleted
            }
        );
        await _context.SaveChangesAsync();
    }

    [Fact]
    public async System.Threading.Tasks.Task ITCID01_ShouldReturn_OnlyActiveTemplates()
    {
        _context.InstructionTemplates.RemoveRange(_context.InstructionTemplates);
        await _context.SaveChangesAsync();

        await SeedDataAsync();
        SetupHttpContext("Assistant", "1");

        var handler = new ViewInstructionTemplateListHandler(
            new InstructionTemplateRepository(_context),
            _httpContextAccessor,
            new UserCommonRepository(_context, _emailService, _memoryCache));

        var result = await handler.Handle(new ViewInstructionTemplateListQuery(), default);

        Assert.Single(result);
        Assert.Equal("Template 1", result[0].Instruc_TemplateName);
    }

    [Fact]
    public async System.Threading.Tasks.Task ITCID02_ShouldInclude_CreatorAndUpdaterName()
    {
        await SeedDataAsync();
        SetupHttpContext("Assistant", "1");

        var handler = new ViewInstructionTemplateListHandler(
            new InstructionTemplateRepository(_context),
            _httpContextAccessor,
            new UserCommonRepository(_context, _emailService, _memoryCache));

        var result = await handler.Handle(new ViewInstructionTemplateListQuery(), default);

        Assert.Equal("Assistant A", result[0].CreateByName);
        Assert.Equal("Updater B", result[0].UpdateByName);
    }

    [Fact]
    public async System.Threading.Tasks.Task ITCID03_ShouldReturnEmpty_WhenAllDeleted()
    {
        _context.InstructionTemplates.RemoveRange(_context.InstructionTemplates);
        await _context.SaveChangesAsync();

        _context.InstructionTemplates.Add(new InstructionTemplate
        {
            Instruc_TemplateID = 3,
            Instruc_TemplateName = "Deleted Template",
            Instruc_TemplateContext = "X",
            CreateBy = 1,
            CreatedAt = DateTime.UtcNow,
            IsDeleted = true
        });
        await _context.SaveChangesAsync();

        SetupHttpContext("Assistant", "1");

        var handler = new ViewInstructionTemplateListHandler(
            new InstructionTemplateRepository(_context),
            _httpContextAccessor,
            new UserCommonRepository(_context, _emailService, _memoryCache));

        var result = await handler.Handle(new ViewInstructionTemplateListQuery(), default);

        Assert.Empty(result);
    }

    [Fact]
    public async System.Threading.Tasks.Task ITCID04_ShouldHandle_MissingUpdateBy()
    {
        _context.InstructionTemplates.RemoveRange(_context.InstructionTemplates);
        await _context.SaveChangesAsync();

        _context.InstructionTemplates.Add(new InstructionTemplate
        {
            Instruc_TemplateID = 4,
            Instruc_TemplateName = "No Update",
            Instruc_TemplateContext = "Context",
            CreatedAt = DateTime.UtcNow,
            CreateBy = 1,
            IsDeleted = false
        });
        await _context.SaveChangesAsync();

        SetupHttpContext("Assistant", "1");

        var handler = new ViewInstructionTemplateListHandler(
            new InstructionTemplateRepository(_context),
            _httpContextAccessor,
            new UserCommonRepository(_context, _emailService, _memoryCache));

        var result = await handler.Handle(new ViewInstructionTemplateListQuery(), default);

        Assert.Equal("N/A", result[0].UpdateByName);
    }

    [Fact]
    public async System.Threading.Tasks.Task ITCID05_ShouldWorkWithEmptyHttpContext()
    {
        _httpContextAccessor.HttpContext = null;

        var handler = new ViewInstructionTemplateListHandler(
            new InstructionTemplateRepository(_context),
            _httpContextAccessor,
            new UserCommonRepository(_context, _emailService, _memoryCache));

        var result = await handler.Handle(new ViewInstructionTemplateListQuery(), default);

        Assert.NotNull(result);
    }
}