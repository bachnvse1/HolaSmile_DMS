using System.Security.Claims;
using Application.Constants;
using Application.Usecases.Dentist.CreateTreatmentProgress;
using AutoMapper;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Dentist;

public class CreateTreatmentProgressIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly CreateTreatmentProgressHandler _handler;
    private readonly IMapper _mapper;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CreateTreatmentProgressIntegrationTests()
    {
        var services = new ServiceCollection();

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase("CreateTreatmentProgressTestDb"));

        services.AddHttpContextAccessor();
        services.AddAutoMapper(typeof(CreateTreatmentProgressHandler).Assembly);

        var provider = services.BuildServiceProvider();
        _context = provider.GetRequiredService<ApplicationDbContext>();
        _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();
        _mapper = provider.GetRequiredService<IMapper>();

        SeedData();

        _handler = new CreateTreatmentProgressHandler(
            new TreatmentProgressRepository(_context),
            _httpContextAccessor,
            _mapper,
            new DentistRepository(_context));
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
    [Fact(DisplayName = "[Integration - ITCID01 -  Normal] Valid_Progress_Should_Return_Success")]
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
                EndTime = DateTime.UtcNow.AddHours(1),
                Note = "Ghi chú thêm"
            }
        };

        var result = await _handler.Handle(command, default);
        Assert.Equal(MessageConstants.MSG.MSG37, result);
    }

    // 🚫 Test 2: Patient không được phép tạo tiến trình
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

    // ⚠️ Test 3: ProgressName null => throw MSG85
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

    // ⚠️ Test 4: EndTime < DateTime.UtcNow => throw MSG84
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
                EndTime = DateTime.UtcNow.AddMinutes(-5)
            }
        };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            _handler.Handle(command, default));

        Assert.Contains(MessageConstants.MSG.MSG84, ex.Message);
    }
}
