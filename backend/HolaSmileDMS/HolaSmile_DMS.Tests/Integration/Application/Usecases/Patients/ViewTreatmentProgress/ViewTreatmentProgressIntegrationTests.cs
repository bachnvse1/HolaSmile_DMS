using Application.Usecases.Patients.ViewTreatmentProgress;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Xunit;

namespace Tests.Integration.Application.Usecases.Patients;

public class ViewTreatmentProgressIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly ViewTreatmentProgressHandler _handler;
    private readonly IMapper _mapper;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ViewTreatmentProgressIntegrationTests()
    {
        var services = new ServiceCollection();

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase(databaseName: "TestDb"));

        services.AddHttpContextAccessor();
        services.AddAutoMapper(typeof(ViewTreatmentProgressHandler).Assembly);

        var provider = services.BuildServiceProvider();
        _context = provider.GetRequiredService<ApplicationDbContext>();
        _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();
        _mapper = provider.GetRequiredService<IMapper>();

        SeedData();

        _handler = new ViewTreatmentProgressHandler(
            new TreatmentProgressRepository(_context),
            _mapper,
            _httpContextAccessor
        );
    }

    private void SeedData()
    {
        _context.Users.RemoveRange(_context.Users);
        _context.Patients.RemoveRange(_context.Patients);
        _context.Dentists.RemoveRange(_context.Dentists);
        _context.TreatmentProgresses.RemoveRange(_context.TreatmentProgresses);
        _context.SaveChanges();

        _context.Users.AddRange(
            new User {
                UserID = 10, Username = "patient1", Phone = "0911111111", Email = "p1@gmail.com", CreatedAt = DateTime.Now
            },
            new User {
                UserID = 20, Username = "dentist1", Phone = "0922222222", Email = "d1@gmail.com", CreatedAt = DateTime.Now
            },
            new User {
                UserID = 30, Username = "assistant1", Phone = "0933333333", Email = "a1@gmail.com", CreatedAt = DateTime.Now
            }
        );

        _context.Patients.Add(new Patient { PatientID = 1, UserID = 10 });
        _context.Dentists.Add(new global::Dentist { DentistId = 2, UserId = 20 });

        _context.TreatmentProgresses.Add(new TreatmentProgress
        {
            TreatmentRecordID = 1,
            PatientID = 1,
            DentistID = 2
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

    // 🟢 Normal: Patient xem đúng hồ sơ của mình
    [Fact(DisplayName = "[Integration - Normal] Patient_Can_View_Own_Progress")]
    [Trait("TestType", "Normal")]
    public async System.Threading.Tasks.Task N_Patient_Can_View_Own_Progress()
    {
        SetupHttpContext("Patient", 10);
        var result = await _handler.Handle(new ViewTreatmentProgressCommand(1), default);
        Assert.NotNull(result);
    }

    // 🟢 Normal: Assistant có thể xem tất cả hồ sơ
    [Fact(DisplayName = "[Integration - Normal] Assistant_Can_View_All_Progress")]
    [Trait("TestType", "Normal")]
    public async System.Threading.Tasks.Task N_Assistant_Can_View_All_Progress()
    {
        SetupHttpContext("Assistant", 30);
        var result = await _handler.Handle(new ViewTreatmentProgressCommand(1), default);
        Assert.NotNull(result);
    }

    // 🔵 Abnormal: Dentist không liên quan cố gắng xem hồ sơ
    [Fact(DisplayName = "[Integration - Abnormal] Dentist_Cannot_View_Others_Progress")]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task A_Dentist_Cannot_View_Others_Progress()
    {
        SetupHttpContext("Dentist", 999); // Dentist không có dữ liệu trong seed
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(new ViewTreatmentProgressCommand(1), default));
    }
}
