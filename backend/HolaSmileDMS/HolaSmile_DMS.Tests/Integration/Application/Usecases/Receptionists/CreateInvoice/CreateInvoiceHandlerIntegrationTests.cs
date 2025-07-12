using System.Security.Claims;
using Application.Constants;
using Application.Usecases.Receptionist.CreateInvoice;
using AutoMapper;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Infrastructure.Repositories;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Receptionists.CreateInvoice;

public class CreateInvoiceHandlerIntegrationTests
{
    private readonly DbContextOptions<ApplicationDbContext> _dbContextOptions;
    private readonly IMapper _mapper;

    public CreateInvoiceHandlerIntegrationTests()
    {
        _dbContextOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var config = new MapperConfiguration(cfg => { });
        _mapper = config.CreateMapper();
    }

    private CreateInvoiceHandler CreateHandler(string role, int userId, int roleTableId)
    {
        var context = new DefaultHttpContext();
        context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim("role_table_id", roleTableId.ToString()),
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.GivenName, "Tester")
        }, "Test"));

        var httpContextAccessor = new Mock<IHttpContextAccessor>();
        httpContextAccessor.Setup(x => x.HttpContext).Returns(context);

        var db = new ApplicationDbContext(_dbContextOptions);

        var invoiceRepo = new InvoiceRepository(db);
        var patientRepo = new PatientRepository(db);
        var treatmentRepo = new TreatmentRecordRepository(db, _mapper);

        var mediator = new Mock<IMediator>();

        return new CreateInvoiceHandler(invoiceRepo, treatmentRepo, httpContextAccessor.Object, patientRepo, mediator.Object);
    }

    private void SeedData()
    {
        using var context = new ApplicationDbContext(_dbContextOptions);

        context.Users.AddRange(
            new User { UserID = 1, Username = "receptionist", Phone = "0111111111" },
            new User { UserID = 2, Username = "patient", Phone = "0111111112" }
        );

        context.Patients.Add(new Patient { PatientID = 101, UserID = 2 });

        context.Appointments.Add(new Appointment
        {
            AppointmentId = 5001,
            PatientId = 101,
            DentistId = 999,
            Status = "confirmed",
            CreatedAt = DateTime.Now,
            AppointmentDate = DateTime.Today.AddDays(1)
        });

        context.TreatmentRecords.Add(new TreatmentRecord
        {
            TreatmentRecordID = 1001,
            AppointmentID = 5001,
            TreatmentStatus = "Completed",
            TotalAmount = 1_000_000
        });

        context.SaveChanges();
    }

    [Fact]
    [Trait("TestType", "Integration")]
    public async System.Threading.Tasks.Task ITCID01_Receptionist_Creates_ValidInvoice_FullPayment()
    {
        SeedData();
        var handler = CreateHandler("Receptionist", userId: 1, roleTableId: 999);

        var command = new CreateInvoiceCommand
        {
            PatientId = 101,
            TreatmentRecordId = 1001,
            PaymentMethod = "cash",
            TransactionType = "full",
            PaidAmount = 1_000_000
        };

        var result = await handler.Handle(command, default);

        Assert.Equal(MessageConstants.MSG.MSG19, result);

        using var verifyContext = new ApplicationDbContext(_dbContextOptions);
        var invoice = verifyContext.Invoices.FirstOrDefault(i => i.TreatmentRecord_Id == 1001);

        Assert.NotNull(invoice);
        Assert.Equal(0, invoice.RemainingAmount);
        Assert.Equal("cash", invoice.PaymentMethod);
        Assert.Equal("full", invoice.TransactionType);
    }

    [Fact]
    [Trait("TestType", "Integration")]
    public async System.Threading.Tasks.Task ITCID02_Receptionist_Creates_PartialPaymentInvoice()
    {
        SeedData();
        var handler = CreateHandler("Receptionist", 1, 999);

        var command = new CreateInvoiceCommand
        {
            PatientId = 101,
            TreatmentRecordId = 1001,
            PaymentMethod = "PayOS",
            TransactionType = "partial",
            PaidAmount = 400_000
        };

        var result = await handler.Handle(command, default);
        Assert.Equal(MessageConstants.MSG.MSG19, result);

        using var verifyContext = new ApplicationDbContext(_dbContextOptions);
        var invoice = verifyContext.Invoices.FirstOrDefault(i => i.TreatmentRecord_Id == 1001 && i.PaidAmount == 400_000);

        Assert.NotNull(invoice);
        Assert.Equal(600_000, invoice.RemainingAmount);
    }

    [Fact]
    [Trait("TestType", "Integration")]
    public async System.Threading.Tasks.Task ITCID03_Patient_Creates_Invoice_For_Themself()
    {
        SeedData();
        var handler = CreateHandler("Patient", userId: 2, roleTableId: 101);

        var command = new CreateInvoiceCommand
        {
            PatientId = 101,
            TreatmentRecordId = 1001,
            PaymentMethod = "cash",
            TransactionType = "partial",
            PaidAmount = 200_000
        };

        var result = await handler.Handle(command, default);

        Assert.Equal(MessageConstants.MSG.MSG19, result);

        using var verifyContext = new ApplicationDbContext(_dbContextOptions);
        var invoice = verifyContext.Invoices.FirstOrDefault(i => i.TreatmentRecord_Id == 1001 && i.PaidAmount == 200_000);
        Assert.NotNull(invoice);
    }

    [Fact]
    [Trait("TestType", "Integration")]
    public async System.Threading.Tasks.Task ITCID04_Patient_Creates_Invoice_For_Other_Fails()
    {
        SeedData();
        var handler = CreateHandler("Patient", userId: 2, roleTableId: 999);

        var command = new CreateInvoiceCommand
        {
            PatientId = 101,
            TreatmentRecordId = 1001,
            PaymentMethod = "cash",
            TransactionType = "partial",
            PaidAmount = 200_000
        };

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }

    [Fact]
    [Trait("TestType", "Integration")]
    public async System.Threading.Tasks.Task ITCID05_PaidAmount_Exceeds_Total_Throws()
    {
        SeedData();
        var handler = CreateHandler("Receptionist", userId: 1, roleTableId: 999);

        var command = new CreateInvoiceCommand
        {
            PatientId = 101,
            TreatmentRecordId = 1001,
            PaymentMethod = "cash",
            TransactionType = "full",
            PaidAmount = 1_500_000
        };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => handler.Handle(command, default));
        Assert.Contains("Tổng tiền thanh toán vượt quá", ex.Message);
    }
}