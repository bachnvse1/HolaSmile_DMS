using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentist.CreateTreatmentProgress;
using Application.Usecases.SendNotification;
using HDMS_API.Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Infrastructure.Hubs;
using Infrastructure.Repositories;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Dentist;

public class CreateTreatmentProgressIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly CreateTreatmentProgressHandler _handler;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CreateTreatmentProgressIntegrationTests()
    {
        var services = new ServiceCollection();

        // 1. In-memory DB
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase("CreateTreatmentProgressTestDb"));

        // 2. Hệ thống cơ bản
        services.AddHttpContextAccessor();
        services.AddAutoMapper(typeof(CreateTreatmentProgressHandler).Assembly);

        // 3. Repository
        services.AddScoped<IPatientRepository, PatientRepository>();
        services.AddScoped<IDentistRepository, DentistRepository>();
        services.AddScoped<ITreatmentProgressRepository, TreatmentProgressRepository>();
        services.AddScoped<INotificationsRepository, NotificationsRepository>();
        services.AddScoped<INotificationsRepository, FakeNotificationsRepository>();

        // ✅ 4. Thay UserCommonRepo bằng fake
        services.AddScoped<IUserCommonRepository, FakeUserCommonRepository>();

        // ✅ 5. Mock email
        var mockEmailService = new Mock<IEmailService>();
        services.AddSingleton<IEmailService>(mockEmailService.Object);

        // ✅ 6. Mock SignalR
        var mockHubContext = new Mock<IHubContext<NotifyHub>>();
        services.AddSingleton<IHubContext<NotifyHub>>(mockHubContext.Object);

        // ✅ 7. MediatR (cho version < 12)
        services.AddMediatR(typeof(CreateTreatmentProgressHandler).Assembly);
        services.AddMediatR(typeof(SendNotificationHandler).Assembly);

        // 8. Đăng ký handler nếu cần resolve bằng tay
        services.AddScoped<CreateTreatmentProgressHandler>();

        // 9. Build
        var provider = services.BuildServiceProvider();

        _context = provider.GetRequiredService<ApplicationDbContext>();
        _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();
        SeedData();

        // ✅ 10. Resolve handler
        _handler = provider.GetRequiredService<CreateTreatmentProgressHandler>();
    }


    private void SeedData()
    {
        _context.Users.RemoveRange(_context.Users);
        _context.Dentists.RemoveRange(_context.Dentists);
        _context.Patients.RemoveRange(_context.Patients);
        _context.TreatmentRecords.RemoveRange(_context.TreatmentRecords);
        _context.SaveChanges();

        _context.Users.AddRange(
            new User { UserID = 10, Username = "dentist", Email = "dentist@mail.com", Phone = "0911111111", CreatedAt = DateTime.Now },
            new User { UserID = 20, Username = "patient", Email = "patient@mail.com", Phone = "0922222222", CreatedAt = DateTime.Now }
        );

        _context.Dentists.Add(new global::Dentist { DentistId = 2, UserId = 10 });
        _context.Patients.Add(new Patient { PatientID = 5, UserID = 20 });
        _context.TreatmentRecords.Add(new TreatmentRecord
        {
            TreatmentRecordID = 1,
            AppointmentID = 1,
            DentistID = 2,
            CreatedAt = DateTime.Now
        });

        _context.SaveChanges();
    }

    private void SetupHttpContext(string role, int userId)
    {
        var context = new DefaultHttpContext();
        context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        }, "Test"));

        _httpContextAccessor.HttpContext = context;
    }

    // ✅ Test 1: Valid progress input
    [Fact(DisplayName = "[Integration - ITCID01 - Normal] Valid_Progress_Should_Return_Success")]
    [Trait("TestType", "Normal")]
    public async System.Threading.Tasks.Task N_Valid_Progress_Should_Return_Success()
    {
        SetupHttpContext("Dentist", 10);

        var command = new CreateTreatmentProgressCommand
        {
            ProgressDto = new CreateTreatmentProgressDto
            {
                TreatmentRecordID = 1,
                PatientID = 5,
                ProgressName = "Tiến trình 1",
                ProgressContent = "Nội dung điều trị",
                Status = "InProgress",
                Duration = 45,
                Description = "Chi tiết tiến trình",
                EndTime = DateTime.Now.AddHours(1),
                Note = "Ghi chú thêm"
            }
        };

        var result = await _handler.Handle(command, default);
        Assert.Equal(MessageConstants.MSG.MSG37, result);
    }

    [Fact(DisplayName = "[Integration - ITCID02 - Abnormal] Patient_Cannot_Create_Treatment_Progress")]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task A_Patient_Cannot_Create_Treatment_Progress()
    {
        SetupHttpContext("Patient", 20);

        var command = new CreateTreatmentProgressCommand
        {
            ProgressDto = new CreateTreatmentProgressDto
            {
                TreatmentRecordID = 1,
                PatientID = 5,
                ProgressName = "Hack tiến trình"
            }
        };

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(command, default));
    }

    [Fact(DisplayName = "[Integration - ITCID03 - Abnormal] ProgressName_Null_Should_Throw")]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task A_ProgressName_Null_Should_Throw()
    {
        SetupHttpContext("Dentist", 10);

        var command = new CreateTreatmentProgressCommand
        {
            ProgressDto = new CreateTreatmentProgressDto
            {
                TreatmentRecordID = 1,
                PatientID = 5,
                ProgressName = null
            }
        };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            _handler.Handle(command, default));

        Assert.Contains(MessageConstants.MSG.MSG85, ex.Message);
    }

    [Fact(DisplayName = "[Integration - ITCID04 - Abnormal] EndTime_In_Past_Should_Throw")]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task A_EndTime_In_Past_Should_Throw()
    {
        SetupHttpContext("Dentist", 10);

        var command = new CreateTreatmentProgressCommand
        {
            ProgressDto = new CreateTreatmentProgressDto
            {
                TreatmentRecordID = 1,
                PatientID = 5,
                ProgressName = "Tiến trình lỗi",
                EndTime = DateTime.Now.AddMinutes(-5)
            }
        };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            _handler.Handle(command, default));

        Assert.Contains(MessageConstants.MSG.MSG84, ex.Message);
    }
}
