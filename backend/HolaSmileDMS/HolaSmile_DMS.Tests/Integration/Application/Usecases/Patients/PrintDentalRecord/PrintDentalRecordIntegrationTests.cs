using System.Security.Claims;
using Application.Usecases.Patients.ViewDentalRecord;
using AutoMapper;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Patients.PrintDentalRecord;

public class PrintDentalRecordIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly ViewDentalExamSheetHandler _handler;
    private readonly IMapper _mapper;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public PrintDentalRecordIntegrationTests()
    {
        // Tạo DB in-memory riêng biệt cho mỗi test
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);

        // Seed dữ liệu mẫu
        SeedData();

        // HttpContext giả lập role Dentist
        _httpContextAccessor = new HttpContextAccessor
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, "1"),
                    new Claim(ClaimTypes.Role, "Dentist")
                }))
            }
        };

        // Khởi tạo handler với repository thật
        _handler = new ViewDentalExamSheetHandler(
            _httpContextAccessor,
            new AppointmentRepository(_context),
            new TreatmentRecordRepository(_context, _mapper),
            new PatientRepository(_context),
            new UserCommonRepository(_context),
            new DentistRepository(_context),
            new ProcedureRepository(_context),
            new WarrantyCardRepository(_context),
            new InvoiceRepository(_context),
            new PrescriptionRepository(_context),
            new InstructionRepository(_context),
            new AppointmentRepository(_context)
        );
    }

    private void SeedData()
    {
        // User
        _context.Users.Add(new User
        {
            UserID = 1,
            Fullname = "Patient A",
            Phone = "0111111111",
            Username = "0111111111"
        });
        
        _context.Users.Add(new User
        {
            UserID = 2,
            Fullname = "Patient A",
            Phone = "0111111111",
            Username = "0111111111"
        });

        // Patient
        _context.Patients.Add(new Patient
        {
            PatientID = 1,
            UserID = 1
        });

        // Dentist
        _context.Dentists.Add(new Dentist
        {
            DentistId = 1,
            UserId = 2 // reuse user
        });

        // Appointment
        _context.Appointments.Add(new Appointment
        {
            AppointmentId = 1,
            PatientId = 1,
            DentistId = 1,
            AppointmentDate = DateTime.Now,
            AppointmentTime = TimeSpan.FromHours(9)
        });

        // Procedure
        _context.Procedures.Add(new Procedure
        {
            ProcedureId = 1,
            ProcedureName = "Tooth Extraction"
        });

        // Treatment Record
        _context.TreatmentRecords.Add(new TreatmentRecord
        {
            TreatmentRecordID = 1,
            AppointmentID = 1,
            DentistID = 1,
            ProcedureID = 1,
            TreatmentDate = DateTime.Now,
            TotalAmount = 500000
        });

        _context.SaveChanges();
    }

    [Fact(DisplayName = "ITCID01 - Get dental record successfully")]
    public async System.Threading.Tasks.Task ITCID01_GetDentalRecord_Success()
    {
        // Act
        var result = await _handler.Handle(new ViewDentalExamSheetCommand(1), default);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.AppointmentId);
        Assert.NotEmpty(result.Treatments);
        Assert.Equal("Patient A", result.PatientName);
    }

    [Fact(DisplayName = "ITCID02 - Unauthorized when patient not owner")]
    public async System.Threading.Tasks.Task ITCID02_GetDentalRecord_Unauthorized()
    {
        // Arrange
        _httpContextAccessor.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "99"),
            new Claim(ClaimTypes.Role, "Patient")
        }));

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(new ViewDentalExamSheetCommand(1), default));
    }
}
