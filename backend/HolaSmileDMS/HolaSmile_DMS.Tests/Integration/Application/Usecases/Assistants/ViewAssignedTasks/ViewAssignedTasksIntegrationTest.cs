using Application.Constants;
using Application.Usecases.Assistant.ViewAssignedTasks;
using Domain.Entities;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants;

public class ViewAssignedTasksIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private ViewAssignedTasksHandler _handler;
    private IHttpContextAccessor _httpContextAccessor;

    public ViewAssignedTasksIntegrationTests()
    {
        var services = new ServiceCollection();

        services.AddDbContext<ApplicationDbContext>(opt =>
            opt.UseInMemoryDatabase(Guid.NewGuid().ToString()));

        var provider = services.BuildServiceProvider();
        _context = provider.GetRequiredService<ApplicationDbContext>();

        SeedData();
    }

    private void SeedData()
    {
        _context.Users.AddRange(
            new User { UserID = 1, Username = "assistant1", Phone = "0111111111", CreatedAt = DateTime.Now },
            new User { UserID = 2, Username = "dentist1", Phone = "0111111112", CreatedAt = DateTime.Now }
        );

        _context.Assistants.Add(new Assistant { AssistantId = 10, UserId = 1 });
        _context.Dentists.Add(new Dentist { DentistId = 20, UserId = 2 });
        _context.Patients.Add(new Patient { PatientID = 30, UserID = 99 });

        _context.Procedures.Add(new Procedure { ProcedureId = 99, ProcedureName = "Lấy cao" });

        _context.TreatmentRecords.Add(new TreatmentRecord
        {
            TreatmentRecordID = 500,
            AppointmentID = 1,
            DentistID = 20,
            ProcedureID = 99,
            Quantity = 1,
            UnitPrice = 100000,
            TotalAmount = 100000,
            TreatmentDate = DateTime.Today,
            CreatedAt = DateTime.Now
        });

        _context.TreatmentProgresses.Add(new TreatmentProgress
        {
            TreatmentProgressID = 100,
            DentistID = 20,
            PatientID = 30,
            TreatmentRecordID = 500,
            ProgressName = "Dọn phòng",
            Status = "Pending",
            EndTime = DateTime.Today.AddHours(10),
            Description = "Chuẩn bị dụng cụ",
            CreatedAt = DateTime.Now
        });

        _context.Tasks.Add(new Task
        {
            TaskID = 1,
            AssistantID = 10,
            TreatmentProgressID = 100,
            ProgressName = "Dọn phòng",
            Description = "Chuẩn bị dụng cụ",
            Status = true,
            StartTime = new TimeSpan(8, 0, 0),
            EndTime = new TimeSpan(9, 0, 0),
            CreatedAt = DateTime.Now,
            CreatedBy = 1
        });

        _context.SaveChanges();
    }

    private void SetupHttpContext(string role, int userId, int roleTableId, bool includeRoleTableClaim = true)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        };

        if (includeRoleTableClaim)
            claims.Add(new Claim("role_table_id", roleTableId.ToString()));

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        var context = new DefaultHttpContext { User = principal };
        _httpContextAccessor = new HttpContextAccessor { HttpContext = context };

        var taskRepo = new TaskRepository(_context);
        _handler = new ViewAssignedTasksHandler(taskRepo, _httpContextAccessor);
    }

    [Fact(DisplayName = "UTCID01 - Assistant gets assigned tasks successfully")]
    public async System.Threading.Tasks.Task UTCID01_GetTasks_ReturnsOne()
    {
        SetupHttpContext("Assistant", 1, 10);

        var command = new ViewAssignedTasksCommand();
        var result = await _handler.Handle(command, default);

        Assert.Single(result);
        Assert.Equal("Dọn phòng", result[0].ProgressName);
        Assert.Equal("Lấy cao", result[0].ProcedureName);
    }

    [Fact(DisplayName = "UTCID02 - No task found for assistant")]
    public async System.Threading.Tasks.Task UTCID02_NoTasks_ReturnsEmpty()
    {
        SetupHttpContext("Assistant", 99, 999); // No assigned tasks

        var command = new ViewAssignedTasksCommand();
        var result = await _handler.Handle(command, default);

        Assert.Empty(result);
    }

    [Fact(DisplayName = "UTCID03 - Invalid role throws unauthorized")]
    public async System.Threading.Tasks.Task UTCID03_InvalidRole_ShouldThrow()
    {
        SetupHttpContext("Receptionist", 1, 10);

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(new ViewAssignedTasksCommand(), default));

        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }

    [Fact(DisplayName = "UTCID04 - Missing role_table_id claim throws unauthorized")]
    public async System.Threading.Tasks.Task UTCID04_MissingClaim_ShouldThrow()
    {
        SetupHttpContext("Assistant", 1, 10, includeRoleTableClaim: false);

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(new ViewAssignedTasksCommand(), default));

        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }

    [Fact(DisplayName = "UTCID05 - Null HttpContext throws unauthorized")]
    public async System.Threading.Tasks.Task UTCID05_NullHttpContext_ShouldThrow()
    {
        _httpContextAccessor = new HttpContextAccessor { HttpContext = null! };
        var taskRepo = new TaskRepository(_context);
        _handler = new ViewAssignedTasksHandler(taskRepo, _httpContextAccessor);

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(new ViewAssignedTasksCommand(), default));

        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }
}
