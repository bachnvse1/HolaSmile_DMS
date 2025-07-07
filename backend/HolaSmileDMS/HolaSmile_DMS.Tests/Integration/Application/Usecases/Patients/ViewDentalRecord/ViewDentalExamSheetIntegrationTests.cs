using System.Security.Claims;
using Application.Interfaces;
using Application.Usecases.Patients.ViewDentalRecord;
using HDMS_API.Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories; // <-- DbContext thật
using Infrastructure.Repositories;                     // <-- Repo impl
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Patients;

public class ViewDentalExamSheetIntegrationTests
{
    // ===== DI helper ======================================================
    private static (ServiceProvider sp,
                    ApplicationDbContext db,
                    Mock<IHttpContextAccessor> httpCtxMock) BuildServices()
    {
        var services = new ServiceCollection();

        // 1. DbContext – mỗi test một DB
        services.AddDbContext<ApplicationDbContext>(opt =>
                opt.UseInMemoryDatabase(Guid.NewGuid().ToString()),
            ServiceLifetime.Singleton); // 👈 thay vì mặc định Scoped


        // 2. AutoMapper (profile của bạn)
        services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

        // 3. Repositories được handler yêu cầu
        services.AddScoped<IAppointmentRepository, AppointmentRepository>();
        services.AddScoped<ITreatmentRecordRepository,TreatmentRecordRepository>();
        services.AddScoped<IPatientRepository, PatientRepository>();
        services.AddScoped<IUserCommonRepository, UserCommonRepository>();
        services.AddScoped<IDentistRepository,  DentistRepository>();
        services.AddScoped<IProcedureRepository, ProcedureRepository>();
        services.AddScoped<IWarrantyCardRepository, WarrantyCardRepository>();
        services.AddScoped<IInvoiceRepository, InvoiceRepository>();
        services.AddScoped<IPrescriptionRepository, PrescriptionRepository>();
        services.AddScoped<IInstructionRepository, InstructionRepository>();

        // 4. Handler
        services.AddScoped<ViewDentalExamSheetHandler>();
// Add Mock EmailService để tránh lỗi DI
        var emailMock = new Mock<IEmailService>();
        services.AddSingleton<IEmailService>(emailMock.Object);
        services.AddMemoryCache();


        // 5. Mock IHttpContextAccessor
        var httpCtxMock = new Mock<IHttpContextAccessor>();
        services.AddSingleton<IHttpContextAccessor>(_ => httpCtxMock.Object);

        var sp = services.BuildServiceProvider();
        var db = sp.GetRequiredService<ApplicationDbContext>();
        return (sp, db, httpCtxMock);
    }

    // ===== Seed data ======================================================
    private static async System.Threading.Tasks.Task SeedDataAsync(ApplicationDbContext context)
    {
        await context.Database.EnsureDeletedAsync();
        await context.Database.EnsureCreatedAsync();

        context.Users.Add(new User { UserID = 1, Username = "patient", Fullname = "Patient", Phone = "0123" });
        context.Patients.Add(new Patient { PatientID = 10, UserID = 1 });

        context.Appointments.Add(new Appointment
        {
            AppointmentId   = 100,
            PatientId       = 10,
            DentistId = 500,
            AppointmentDate = DateTime.Today,
            AppointmentTime = new TimeSpan(9, 0, 0),
            Content         = "Tái khám"
        });

        context.TreatmentRecords.Add(new TreatmentRecord
        {
            TreatmentRecordID = 200,
            AppointmentID     = 100,
            ProcedureID       = 300,
            DentistID         = 500,
            Quantity          = 2,
            UnitPrice         = 100,
            TotalAmount       = 200,
            DiscountAmount    = 20,
            TreatmentDate     = DateTime.Today
        });

        context.Users.Add(new User { UserID = 2, Username = "dentist", Fullname = "Dr. D", Phone = "0111" });
        context.Dentists.Add(new Dentist { DentistId = 500, UserId = 2 });

        context.Procedures  .Add(new Procedure  { ProcedureId  = 300, ProcedureName = "Nhổ răng" });
        context.Invoices    .Add(new Invoice    { InvoiceId    = 1, TreatmentRecord_Id = 200, PaidAmount = 150, PaymentDate = DateTime.Today });
        context.Prescriptions.Add(new Prescription { PrescriptionId = 1, TreatmentRecord_Id = 200, Content = "Kháng sinh" });
        context.Instructions .Add(new Instruction  { InstructionID  = 1, TreatmentRecord_Id = 200, Content = "Nghỉ ngơi" });

        await context.SaveChangesAsync();
    }

    // ===== HttpContext helper ============================================
    private static void SetupHttpContext(Mock<IHttpContextAccessor> mock, string role, int userId)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role)
        };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        mock.Setup(x => x.HttpContext!.User).Returns(principal);
    }

    // ===== TEST CASES =====================================================

    [Fact, Trait("ITCID", "ITCID01")]
    public async System.Threading.Tasks.Task Assistant_Can_View_Valid_ExamSheet()
    {
        var (sp, db, httpMock) = BuildServices();
        await SeedDataAsync(db);
        SetupHttpContext(httpMock, "Assistant", 999);

        var handler = sp.GetRequiredService<ViewDentalExamSheetHandler>();
        var result  = await handler.Handle(new ViewDentalExamSheetCommand(100), CancellationToken.None);

        Assert.Equal(100,  result.AppointmentId);
        Assert.Single(result.Treatments);
        Assert.Single(result.Payments);
        Assert.Contains("Kháng sinh", result.PrescriptionItems);
        Assert.Contains("Nghỉ ngơi",  result.Instructions);
    }

    [Fact, Trait("ITCID", "ITCID02")]
    public async System.Threading.Tasks.Task Patient_Can_View_Own_ExamSheet()
    {
        var (sp, db, httpMock) = BuildServices();
        await SeedDataAsync(db);
        SetupHttpContext(httpMock, "Patient", 1);

        var handler = sp.GetRequiredService<ViewDentalExamSheetHandler>();
        var result  = await handler.Handle(new ViewDentalExamSheetCommand(100), CancellationToken.None);

        Assert.Equal("Patient", result.PatientName);
    }

    [Fact, Trait("ITCID", "ITCID03")]
    public async System.Threading.Tasks.Task Patient_Cannot_View_Other_Patient_Record()
    {
        var (sp, db, httpMock) = BuildServices();
        await SeedDataAsync(db);
        SetupHttpContext(httpMock, "Patient", 999);

        var handler = sp.GetRequiredService<ViewDentalExamSheetHandler>();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(new ViewDentalExamSheetCommand(100), CancellationToken.None));
    }

    [Fact, Trait("ITCID", "ITCID04")]
    public async System.Threading.Tasks.Task Throw_If_No_Treatment_Record()
    {
        var (sp, db, httpMock) = BuildServices();
        SetupHttpContext(httpMock, "Assistant", 999);

        db.Users.Add(new User { UserID = 1, Fullname = "P", Phone = "1" , Username = "1"});
        db.Patients.Add(new Patient { PatientID = 10, UserID = 1 });
        db.Appointments.Add(new Appointment { AppointmentId = 200, PatientId = 10 });
        await db.SaveChangesAsync();

        var handler = sp.GetRequiredService<ViewDentalExamSheetHandler>();

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            handler.Handle(new ViewDentalExamSheetCommand(200), CancellationToken.None));
    }

    [Fact, Trait("ITCID", "ITCID05")]
    public async System.Threading.Tasks.Task Should_Calculate_Costs_Correctly()
    {
        var (sp, db, httpMock) = BuildServices();
        await SeedDataAsync(db);
        SetupHttpContext(httpMock, "Assistant", 999);

        var handler = sp.GetRequiredService<ViewDentalExamSheetHandler>();
        var result  = await handler.Handle(new ViewDentalExamSheetCommand(100), CancellationToken.None);

        Assert.Equal(200, result.GrandTotal);
        Assert.Equal(20,  result.GrandDiscount);
        Assert.Equal(180, result.GrandCost);
        Assert.Equal(150, result.Paid);
        Assert.Equal(30,  result.Remaining);
    }
}
