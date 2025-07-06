using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentist.CreateTreatmentRecord;
using AutoMapper;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Infrastructure.Repositories;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Dentists;

public class CreateTreatmentRecordIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly CreateTreatmentRecordHandler _handler;
    private readonly IMapper _mapper;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IMediator _mediator;
    private readonly IAppointmentRepository _appointmentRepository;
    private readonly IPatientRepository _patientRepository;

    public CreateTreatmentRecordIntegrationTests()
    {
        var services = new ServiceCollection();

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase("CreateTreatmentRecordTestDb"));

        services.AddHttpContextAccessor();
        services.AddAutoMapper(typeof(CreateTreatmentRecordHandler).Assembly);

        services.AddMediatR(typeof(CreateTreatmentRecordHandler).Assembly);
        
        services.AddScoped<IAppointmentRepository, AppointmentRepository>();
        services.AddScoped<IPatientRepository, PatientRepository>();

        var provider = services.BuildServiceProvider();
        _context = provider.GetRequiredService<ApplicationDbContext>();
        _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();
        _mapper = provider.GetRequiredService<IMapper>();
        _mediator = provider.GetRequiredService<IMediator>();
        _appointmentRepository = provider.GetRequiredService<IAppointmentRepository>();
        _patientRepository = provider.GetRequiredService<IPatientRepository>();

        SeedData();

        _handler = new CreateTreatmentRecordHandler(
            new TreatmentRecordRepository(_context, _mapper),
            _mapper,
            _httpContextAccessor,
            _mediator,
            _appointmentRepository,
            _patientRepository
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

        _context.Dentists.Add(new global::Dentist { DentistId = 2, UserId = 10 });
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

    // 🟢 Normal: Tạo hồ sơ hợp lệ
    [Fact(DisplayName = "[Integration - Normal] Valid_Command_Should_Return_Success")]
    [Trait("TestType", "Normal")]
    public async System.Threading.Tasks.Task N_Valid_Command_Should_Return_Success()
    {
        SetupHttpContext("Dentist", 10);
        var cmd = new CreateTreatmentRecordCommand
        {
            AppointmentId = 10,
            DentistId = 2,
            ProcedureId = 1,
            UnitPrice = 500000,
            Quantity = 1,
            TreatmentDate = DateTime.Now,
        };

        var result = await _handler.Handle(cmd, default);
        Assert.Equal(MessageConstants.MSG.MSG31, result);
    }

    // 🔵 Abnormal: Không có procedureId
    [Fact(DisplayName = "[Integration - Abnormal] Missing_ProcedureId_Should_Throw")]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task A_Missing_ProcedureId_Should_Throw()
    {
        SetupHttpContext("Dentist", 10);
        var cmd = new CreateTreatmentRecordCommand
        {
            AppointmentId = 10,
            DentistId = 2,
            ProcedureId = 0, // invalid
            UnitPrice = 100,
            Quantity = 1
        };

        await Assert.ThrowsAsync<Exception>(() => _handler.Handle(cmd, default));
    }

    // 🟡 Boundary: Giảm giá > tổng tiền
    [Fact(DisplayName = "[Integration - Boundary] Discount_Too_High_Should_Throw")]
    [Trait("TestType", "Boundary")]
    public async System.Threading.Tasks.Task B_Discount_Too_High_Should_Throw()
    {
        SetupHttpContext("Dentist", 10);
        var cmd = new CreateTreatmentRecordCommand
        {
            AppointmentId = 10,
            DentistId = 2,
            ProcedureId = 1,
            UnitPrice = 100,
            Quantity = 1,
            DiscountAmount = 999999 // quá cao
        };

        await Assert.ThrowsAsync<Exception>(() => _handler.Handle(cmd, default));
    }

    // 🔵 Abnormal: Role không hợp lệ
    [Fact(DisplayName = "[Integration - Abnormal] Unauthorized_User_Should_Throw")]
    [Trait("TestType", "Abnormal")]
    public async System.Threading.Tasks.Task A_Unauthorized_User_Should_Throw()
    {
        SetupHttpContext("Patient", 20);
        var cmd = new CreateTreatmentRecordCommand
        {
            AppointmentId = 10,
            DentistId = 2,
            ProcedureId = 1,
            UnitPrice = 100,
            Quantity = 1
        };

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(cmd, default));
    }
}
