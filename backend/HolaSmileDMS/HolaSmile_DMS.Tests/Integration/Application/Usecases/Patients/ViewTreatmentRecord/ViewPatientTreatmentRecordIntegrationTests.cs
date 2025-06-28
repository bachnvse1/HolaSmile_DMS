using System.Security.Claims;
using Application.Interfaces;
using Application.Usecases.Patients.ViewTreatmentRecord;
using AutoMapper;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Patients;

public class ViewPatientTreatmentRecordIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly ViewPatientTreatmentRecordHandler _handler;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IMapper _mapper;

    public ViewPatientTreatmentRecordIntegrationTests()
    {
        var services = new ServiceCollection();

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase(Guid.NewGuid().ToString()));

        services.AddHttpContextAccessor();

        // Add AutoMapper using Application layer assembly (adjust if needed)
        services.AddAutoMapper(typeof(ViewPatientTreatmentRecordHandler).Assembly);

        var provider = services.BuildServiceProvider();

        _context = provider.GetRequiredService<ApplicationDbContext>();
        _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();
        _mapper = provider.GetRequiredService<IMapper>();

        var repo = new TreatmentRecordRepository(_context, _mapper);

        SeedData();

        _handler = new ViewPatientTreatmentRecordHandler(repo, _httpContextAccessor);
    }

    private void SeedData()
    {
        _context.Users.RemoveRange(_context.Users);
        _context.Dentists.RemoveRange(_context.Dentists);
        _context.Patients.RemoveRange(_context.Patients);
        _context.TreatmentRecords.RemoveRange(_context.TreatmentRecords);
        _context.SaveChanges();

        _context.Users.AddRange(
            new User { UserID = 10, Username = "dentist", Email = "dentist@mail.com" , Phone = "0333538991"},
            new User { UserID = 20, Username = "patient1", Email = "patient1@mail.com", Phone = "0333538991"},
            new User { UserID = 30, Username = "patient2", Email = "patient2@mail.com", Phone = "0333538991"}
        );

        _context.Dentists.Add(new global::Dentist { DentistId = 1, UserId = 10 });
        _context.Patients.AddRange(
            new Patient { PatientID = 1, UserID = 20 },
            new Patient { PatientID = 2, UserID = 30 }
        );
        _context.Appointments.Add(new Appointment
        {
            AppointmentId = 1,
            PatientId = 1,
            DentistId = 1,
            AppointmentDate = DateTime.Today,
            AppointmentTime = new TimeSpan(9, 0, 0),
            Status = "Completed"
        });
        
        
        _context.Procedures.Add(
            new Procedure()
            {
                ProcedureId = 1,
                ProcedureName = "Nho rang"
            }
        );
        _context.TreatmentRecords.Add(new TreatmentRecord
        {
            TreatmentRecordID = 100,
            AppointmentID = 1,
            ProcedureID = 1,
            DentistID = 1,
            Quantity = 1,
            UnitPrice = 500000,
            TotalAmount = 500000,
            CreatedAt = DateTime.Now,
            TreatmentDate = DateTime.Today
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

    [Fact(DisplayName = "[Integration - Normal] Patient_Can_View_Their_Own_Records")]
    [Trait("TestType", "Normal")]
    public async System.Threading.Tasks.Task ITCID01_Patient_Can_View_Their_Own_Records()
    {
        SetupHttpContext("Patient", 20);

        var result = await _handler.Handle(new ViewTreatmentRecordsCommand(20), default);

        Assert.NotNull(result);
        Assert.Single(result);
    }

    [Fact(DisplayName = "[Integration - Normal] Dentist_Can_View_Patient_Records")]
    [Trait("TestType", "Normal")]
    public async System.Threading.Tasks.Task ITCID02_Dentist_Can_View_Patient_Records()
    {
        SetupHttpContext("Dentist", 10);
        var result = await _handler.Handle(new ViewTreatmentRecordsCommand(20), default);

        Assert.NotNull(result);
        Assert.Single(result); 
    }

    [Fact(DisplayName = "[Integration - Abnormal] Other_Patient_Cannot_View_Records")]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task ITCID03_Other_Patient_Cannot_View_Records()
    {
        SetupHttpContext("Patient", 30);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(new ViewTreatmentRecordsCommand(20), default));
    }

    [Fact(DisplayName = "[Integration - Abnormal] No_Records_Should_Throw_MSG16")]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task ITCID04_No_Records_Should_Throw_MSG16()
    {
        SetupHttpContext("Dentist", 10);
        
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _handler.Handle(new ViewTreatmentRecordsCommand(999), default));
    }
}
