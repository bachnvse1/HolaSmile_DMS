// ✅ INTEGRATION TEST (refactored to standard format)
using Application.Constants;
using Application.Usecases.Dentist.CreateTreatmentRecord;
using AutoMapper;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using Xunit;

public class CreateTreatmentRecordIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly CreateTreatmentRecordHandler _handler;
    private readonly IMapper _mapper;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CreateTreatmentRecordIntegrationTests()
    {
        var services = new ServiceCollection();

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase("CreateTreatmentRecordTestDb"));
        services.AddHttpContextAccessor();
        services.AddAutoMapper(typeof(CreateTreatmentRecordHandler).Assembly);

        var provider = services.BuildServiceProvider();
        _context = provider.GetRequiredService<ApplicationDbContext>();
        _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();
        _mapper = provider.GetRequiredService<IMapper>();

        SeedData();

        _handler = new CreateTreatmentRecordHandler(
            new TreatmentRecordRepository(_context, _mapper),
            _mapper,
            _httpContextAccessor
        );
    }

    private void SeedData()
    {
        _context.Users.RemoveRange(_context.Users);
        _context.Dentists.RemoveRange(_context.Dentists);
        _context.Procedures.RemoveRange(_context.Procedures);
        _context.Appointments.RemoveRange(_context.Appointments);
        _context.TreatmentRecords.RemoveRange(_context.TreatmentRecords);
        _context.SaveChanges();

        _context.Users.AddRange(
            new User { UserID = 10, Username = "dentist", Email = "dentist@mail.com", Phone = "0911111111", CreatedAt = DateTime.Now },
            new User { UserID = 20, Username = "patient", Email = "patient@mail.com", Phone = "0922222222", CreatedAt = DateTime.Now }
        );

        _context.Dentists.Add(new Dentist { DentistId = 2, UserId = 10 });
        _context.Procedures.Add(new Procedure { ProcedureId = 1, ProcedureName = "Trám răng" });
        _context.Appointments.Add(new Appointment { AppointmentId = 10, PatientId = 1, DentistId = 2 });

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

    [Fact(DisplayName = "[Integration] Missing ProcedureId should fail")]
    public async global::System.Threading.Tasks.Task Missing_ProcedureId_Should_Fail()
    {
        SetupHttpContext("Dentist", 10);
        var cmd = new CreateTreatmentRecordCommand { AppointmentId = 10, DentistId = 2, ProcedureId = 0, UnitPrice = 100, Quantity = 1 };
        await Assert.ThrowsAsync<Exception>(() => _handler.Handle(cmd, default));
    }

    [Fact(DisplayName = "[Integration] Valid command should return success")]
    public async global::System.Threading.Tasks.Task Valid_Command_Should_Return_Success()
    {
        SetupHttpContext("Dentist", 10);
        var cmd = new CreateTreatmentRecordCommand { AppointmentId = 10, DentistId = 2, ProcedureId = 1, UnitPrice = 500000, Quantity = 1 };
        var result = await _handler.Handle(cmd, default);
        Assert.Equal(MessageConstants.MSG.MSG31, result);
    }

    [Fact(DisplayName = "[Integration] Discount greater than total should fail")]
    public async global::System.Threading.Tasks.Task Discount_Too_High_Should_Throw()
    {
        SetupHttpContext("Dentist", 10);
        var cmd = new CreateTreatmentRecordCommand { AppointmentId = 10, DentistId = 2, ProcedureId = 1, UnitPrice = 100, Quantity = 1, DiscountAmount = 999999 };
        await Assert.ThrowsAsync<Exception>(() => _handler.Handle(cmd, default));
    }

    [Fact(DisplayName = "[Integration] Unauthorized user should not access")]
    public async global::System.Threading.Tasks.Task Unauthorized_User_Should_Fail()
    {
        SetupHttpContext("Patient", 20);
        var cmd = new CreateTreatmentRecordCommand { AppointmentId = 10, DentistId = 2, ProcedureId = 1, UnitPrice = 100, Quantity = 1 };
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(cmd, default));
    }
}
