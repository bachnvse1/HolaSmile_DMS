using System.Security.Claims;
using Application.Interfaces;
using Application.Usecases.Receptionist.UpdateInvoice;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Infrastructure.Repositories;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Receptionists.UpdateInvoice;

public class UpdateInvoiceHandlerIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly IInvoiceRepository _invoiceRepository;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly Mock<IMediator> _mediatorMock = new();
    private readonly IPatientRepository _patientRepository;

    public UpdateInvoiceHandlerIntegrationTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"UpdateInvoiceTest_{Guid.NewGuid()}")
            .Options;
        _context = new ApplicationDbContext(options);
        _invoiceRepository = new InvoiceRepository(_context);
        _httpContextAccessor = new HttpContextAccessor();
        _patientRepository = new PatientRepository(_context);
        SeedData();
    }

    private void SeedData()
    {
        _context.Users.Add(new User { UserID = 2, Username = "receptionist", Phone = "0123456789" });
        _context.Patients.Add(new Patient { PatientID = 5, UserID = 10 });
        _context.Invoices.Add(new Invoice
        {
            InvoiceId = 1,
            OrderCode = "INV001",
            PatientId = 5,
            TreatmentRecord_Id = 100,
            TotalAmount = 1000,
            PaidAmount = 300,
            RemainingAmount = 700,
            Status = "pending",
            PaymentMethod = "cash",
            TransactionType = "partial",
            Description = "Initial",
            CreatedAt = DateTime.Now.AddDays(-1)
        });
        _context.SaveChanges();
    }

    private void SetupHttpContext(string role, int userId, int? roleTableId = null)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role),
        };
        if (roleTableId.HasValue)
            claims.Add(new Claim("role_table_id", roleTableId.ToString()));
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        _httpContextAccessor.HttpContext = new DefaultHttpContext { User = principal };
    }

    [Fact(DisplayName = "ITCID01 - Receptionist successfully updates invoice")]
    public async System.Threading.Tasks.Task ITCID01_Receptionist_successfully_updates_invoice()
    {
        SetupHttpContext("Receptionist", 2, 5);
        var handler = new UpdateInvoiceHandler(_invoiceRepository, _httpContextAccessor, _patientRepository, _mediatorMock.Object);

        var command = new UpdateInvoiceCommand
        {
            InvoiceId = 1,
            PatientId = 5,
            PaidAmount = 200,
            PaymentMethod = "PayOS",
            TransactionType = "partial",
            Description = "Test update"
        };

        var result = await handler.Handle(command, default);

        // ✅ Assert return message
        Assert.Equal("Cập nhật hoá đơn thành công", result);

        // ✅ TestRepo: Kiểm tra DB thay đổi
        var updatedInvoice = await _context.Invoices.FindAsync(1);
        Assert.Equal("PayOS", updatedInvoice?.PaymentMethod);
        Assert.Equal("partial", updatedInvoice?.TransactionType);
        Assert.Equal("Test update", updatedInvoice?.Description);
        Assert.Equal(200, updatedInvoice?.PaidAmount);
        Assert.Equal(800, updatedInvoice?.RemainingAmount); // 1000 - 200
        Assert.Equal(2, updatedInvoice?.UpdatedBy);
    }

    [Fact(DisplayName = "ITCID02 - Patient tries to update invoice not belonging to them")]
    public async System.Threading.Tasks.Task ITCID02_Patient_tries_to_update_invoice_not_belonging_to_them()
    {
        SetupHttpContext("Patient", 3, 999);
        var handler = new UpdateInvoiceHandler(_invoiceRepository, _httpContextAccessor, _patientRepository, _mediatorMock.Object);
        var command = new UpdateInvoiceCommand { InvoiceId = 1, PatientId = 999 };
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(command, default));
    }

    [Fact(DisplayName = "ITCID03 - Invoice not found")]
    public async System.Threading.Tasks.Task ITCID03_Invoice_not_found()
    {
        SetupHttpContext("Receptionist", 2, 5);
        var handler = new UpdateInvoiceHandler(_invoiceRepository, _httpContextAccessor, _patientRepository, _mediatorMock.Object);
        var command = new UpdateInvoiceCommand { InvoiceId = 999, PatientId = 5 };
        await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, default));
    }

    [Fact(DisplayName = "ITCID04 - Invoice already paid throws error")]
    public async System.Threading.Tasks.Task ITCID04_Invoice_already_paid_throws_error()
    {
        var invoice = await _context.Invoices.FindAsync(1);
        invoice.Status = "paid";
        await _context.SaveChangesAsync();

        SetupHttpContext("Receptionist", 2, 5);
        var handler = new UpdateInvoiceHandler(_invoiceRepository, _httpContextAccessor, _patientRepository, _mediatorMock.Object);
        var command = new UpdateInvoiceCommand { InvoiceId = 1, PatientId = 5 };
        await Assert.ThrowsAsync<InvalidOperationException>(() => handler.Handle(command, default));
    }

    [Fact(DisplayName = "ITCID05 - PaidAmount exceeds total amount")]
    public async System.Threading.Tasks.Task ITCID05_PaidAmount_exceeds_total_amount()
    {
        SetupHttpContext("Receptionist", 2, 5);
        var handler = new UpdateInvoiceHandler(_invoiceRepository, _httpContextAccessor, _patientRepository, _mediatorMock.Object);
        var command = new UpdateInvoiceCommand
        {
            InvoiceId = 1,
            PatientId = 5,
            PaidAmount = 1200
        };
        await Assert.ThrowsAsync<ArgumentException>(() => handler.Handle(command, default));
    }
}