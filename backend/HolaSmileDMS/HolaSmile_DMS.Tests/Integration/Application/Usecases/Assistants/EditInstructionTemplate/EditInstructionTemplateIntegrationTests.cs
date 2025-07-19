using System.Security.Claims;
using Application.Constants;
using Application.Usecases.Assistants.EditInstructionTemplate;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants.EditInstructionTemplate;

public class EditInstructionTemplateIntegrationTests
{
    private readonly string _dbName = $"EditInstructionTemplateTestDb_{Guid.NewGuid()}";
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public EditInstructionTemplateIntegrationTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(_dbName)
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
        _httpContextAccessor.HttpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(claims))
        };
    }

    private async System.Threading.Tasks.Task SeedTemplateAsync(bool isDeleted = false)
    {
        _context.InstructionTemplates.Add(new InstructionTemplate
        {
            Instruc_TemplateID = 1,
            Instruc_TemplateName = "Old Name",
            Instruc_TemplateContext = "Old Context",
            CreateBy = 1,
            CreatedAt = DateTime.UtcNow,
            IsDeleted = isDeleted
        });
        await _context.SaveChangesAsync();
    }

    [Fact]
    public async System.Threading.Tasks.Task ITCID01_ShouldUpdateRepositoryCorrectly()
    {
            // Khởi tạo tên database duy nhất
        var dbName = $"Db_{Guid.NewGuid()}";

        // Tạo context để seed
        var seedOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        using (var seedContext = new ApplicationDbContext(seedOptions))
        {
            seedContext.InstructionTemplates.Add(new InstructionTemplate
            {
                Instruc_TemplateID = 1,
                Instruc_TemplateName = "Old Name",
                Instruc_TemplateContext = "Old Content",
                CreateBy = 1,
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            });
            await seedContext.SaveChangesAsync();
        }

        // Tạo context để chạy handler
        var handlerOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        var contextForHandler = new ApplicationDbContext(handlerOptions);

        // Setup HttpContext
        var httpContextAccessor = new HttpContextAccessor();
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Role, "Assistant"),
            new Claim(ClaimTypes.NameIdentifier, "123")
        };
        httpContextAccessor.HttpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(claims))
        };

        var handler = new EditInstructionTemplateHandler(
            new InstructionTemplateRepository(contextForHandler),
            httpContextAccessor);

        var command = new EditInstructionTemplateCommand
        {
            Instruc_TemplateID = 1,
            Instruc_TemplateName = "New Name",
            Instruc_TemplateContext = "New Content"
        };

        var result = await handler.Handle(command, default);

        // Tạo context mới để verify
        var verifyOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        using var verifyContext = new ApplicationDbContext(verifyOptions);
        var updated = await verifyContext.InstructionTemplates.FindAsync(1);

        Assert.Equal("New Name", updated.Instruc_TemplateName);
        Assert.Equal("New Content", updated.Instruc_TemplateContext);
        Assert.Equal(123, updated.UpdatedBy);
        Assert.Equal(MessageConstants.MSG.MSG107, result);
    }

    [Fact]
    public async System.Threading.Tasks.Task ITCID02_ShouldThrow_WhenNotAssistant()
    {
        await SeedTemplateAsync();
        SetupHttpContext("Receptionist", "100");

        var handler = new EditInstructionTemplateHandler(
            new InstructionTemplateRepository(_context),
            _httpContextAccessor);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(new EditInstructionTemplateCommand
        {
            Instruc_TemplateID = 1,
            Instruc_TemplateName = "X",
            Instruc_TemplateContext = "Y"
        }, default));
    }

    [Fact]
    public async System.Threading.Tasks.Task ITCID03_ShouldThrow_WhenTemplateNotFound()
    {
        SetupHttpContext("Assistant", "5");

        var handler = new EditInstructionTemplateHandler(
            new InstructionTemplateRepository(_context),
            _httpContextAccessor);

        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(new EditInstructionTemplateCommand
        {
            Instruc_TemplateID = 999,
            Instruc_TemplateName = "ABC",
            Instruc_TemplateContext = "DEF"
        }, default));

        Assert.Equal(MessageConstants.MSG.MSG115, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task ITCID04_ShouldThrow_WhenTemplateIsDeleted()
    {
        await SeedTemplateAsync(isDeleted: true);
        SetupHttpContext("Assistant", "5");

        var handler = new EditInstructionTemplateHandler(
            new InstructionTemplateRepository(_context),
            _httpContextAccessor);

        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(new EditInstructionTemplateCommand
        {
            Instruc_TemplateID = 1,
            Instruc_TemplateName = "ABC",
            Instruc_TemplateContext = "DEF"
        }, default));

        Assert.Equal(MessageConstants.MSG.MSG115, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task ITCID05_ShouldPreserveCreatedFields_AfterUpdate()
    {
            // 🔁 Tạo tên database riêng
        var dbName = $"Db_{Guid.NewGuid()}";

        // ✅ Seed dữ liệu
        var seedOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        using (var seedContext = new ApplicationDbContext(seedOptions))
        {
            seedContext.InstructionTemplates.Add(new InstructionTemplate
            {
                Instruc_TemplateID = 1,
                Instruc_TemplateName = "Old Name",
                Instruc_TemplateContext = "Old Context",
                CreateBy = 1,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                IsDeleted = false
            });
            await seedContext.SaveChangesAsync();
        }

        // ✅ Tạo context để chạy handler
        var handlerOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        var contextForHandler = new ApplicationDbContext(handlerOptions);

        // Setup HttpContext cho role Assistant, userId = 5
        var httpContextAccessor = new HttpContextAccessor();
        httpContextAccessor.HttpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Role, "Assistant"),
                new Claim(ClaimTypes.NameIdentifier, "5")
            }))
        };

        var handler = new EditInstructionTemplateHandler(
            new InstructionTemplateRepository(contextForHandler),
            httpContextAccessor);

        // Gửi command để cập nhật
        var command = new EditInstructionTemplateCommand
        {
            Instruc_TemplateID = 1,
            Instruc_TemplateName = "Updated Name",
            Instruc_TemplateContext = "Updated Context"
        };

        await handler.Handle(command, default);

        // ✅ Mở context verify riêng
        var verifyOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        using var verifyContext = new ApplicationDbContext(verifyOptions);
        var template = await verifyContext.InstructionTemplates.FindAsync(1);

        // Kiểm tra dữ liệu gốc vẫn giữ nguyên
        Assert.Equal(1, template.CreateBy);
        Assert.NotNull(template.CreatedAt);
        Assert.Equal("Updated Name", template.Instruc_TemplateName);
        Assert.Equal("Updated Context", template.Instruc_TemplateContext);
        Assert.Equal(5, template.UpdatedBy);
    }
}