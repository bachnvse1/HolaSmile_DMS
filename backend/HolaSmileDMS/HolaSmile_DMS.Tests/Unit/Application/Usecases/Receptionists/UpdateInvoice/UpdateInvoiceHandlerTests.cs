using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Receptionist.UpdateInvoice;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Receptionists;

public class UpdateInvoiceHandlerTests
{
    private readonly Mock<IInvoiceRepository> _invoiceRepoMock = new();
    private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
    private readonly Mock<IPatientRepository> _patientRepoMock = new();
    private readonly Mock<IMediator> _mediatorMock = new();

    private UpdateInvoiceHandler CreateHandlerWithContext(ClaimsPrincipal? user = null)
    {
        _httpContextAccessorMock.Setup(h => h.HttpContext!.User).Returns(user ?? new ClaimsPrincipal());
        return new UpdateInvoiceHandler(
            _invoiceRepoMock.Object,
            _httpContextAccessorMock.Object,
            _patientRepoMock.Object,
            _mediatorMock.Object
        );
    }

    [Fact]
    public async System.Threading.Tasks.Task UTC01_Throws_Unauthorized_When_HttpContext_Is_Null()
    {
        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns((HttpContext)null!);
        var handler = CreateHandlerWithContext();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(new UpdateInvoiceCommand(), default));
    }

    [Fact]
    public async System.Threading.Tasks.Task UTC02_Throws_Unauthorized_When_Role_Not_Receptionist_Or_Patient()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim(ClaimTypes.Role, "Dentist"),
        }, "mock"));

        var handler = CreateHandlerWithContext(user);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(new UpdateInvoiceCommand(), default));
    }

    [Fact]
    public async System.Threading.Tasks.Task UTC03_Throws_Unauthorized_When_Patient_Update_Not_Own_Invoice()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "10"),
            new Claim(ClaimTypes.Role, "Patient"),
            new Claim("role_table_id", "99")
        }));

        _invoiceRepoMock.Setup(x => x.GetInvoiceByIdAsync(It.IsAny<int>())).ReturnsAsync(new Invoice
        {
            PatientId = 100,
            Status = "pending"
        });

        var handler = CreateHandlerWithContext(user);
        var command = new UpdateInvoiceCommand { InvoiceId = 1 };

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(command, default));
    }

    [Fact]
    public async System.Threading.Tasks.Task UTC04_Throws_InvalidOperation_When_Invoice_Not_Pending()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "2"),
            new Claim(ClaimTypes.Role, "Receptionist"),
        }));

        _invoiceRepoMock.Setup(x => x.GetInvoiceByIdAsync(It.IsAny<int>())).ReturnsAsync(new Invoice
        {
            Status = "paid",
            PatientId = 1
        });

        var handler = CreateHandlerWithContext(user);
        var command = new UpdateInvoiceCommand { InvoiceId = 1 };

        await Assert.ThrowsAsync<InvalidOperationException>(() => handler.Handle(command, default));
    }

    [Fact]
    public async System.Threading.Tasks.Task UTC05_Throws_ArgumentException_When_PaymentMethod_Invalid()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "2"),
            new Claim(ClaimTypes.Role, "Receptionist"),
        }));

        _invoiceRepoMock.Setup(x => x.GetInvoiceByIdAsync(It.IsAny<int>())).ReturnsAsync(new Invoice
        {
            Status = "pending",
            PatientId = 1
        });

        var handler = CreateHandlerWithContext(user);
        var command = new UpdateInvoiceCommand { InvoiceId = 1, PaymentMethod = "Momo" };

        await Assert.ThrowsAsync<ArgumentException>(() => handler.Handle(command, default));
    }

    [Fact]
    public async System.Threading.Tasks.Task UTC06_Throws_When_Paid_Amount_Exceeds_Total()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "2"),
            new Claim(ClaimTypes.Role, "Receptionist"),
        }));

        var invoice = new Invoice
        {
            InvoiceId = 1,
            PatientId = 1,
            Status = "pending",
            TotalAmount = 500,
            TreatmentRecord_Id = 10
        };

        _invoiceRepoMock.Setup(x => x.GetInvoiceByIdAsync(It.IsAny<int>())).ReturnsAsync(invoice);
        _invoiceRepoMock.Setup(x => x.GetTotalPaidForTreatmentRecord(It.IsAny<int>())).ReturnsAsync(400);

        var handler = CreateHandlerWithContext(user);
        var command = new UpdateInvoiceCommand
        {
            InvoiceId = 1,
            PaidAmount = 200
        };

        await Assert.ThrowsAsync<ArgumentException>(() => handler.Handle(command, default));
    }

    [Fact]
    public async System.Threading.Tasks.Task UTC07_Successfully_Updates_Invoice()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "2"),
            new Claim(ClaimTypes.Role, "Receptionist"),
        }));

        var invoice = new Invoice
        {
            InvoiceId = 1,
            PatientId = 5,
            Status = "pending",
            TotalAmount = 1000,
            TreatmentRecord_Id = 10,
            OrderCode = "INV001"
        };

        _invoiceRepoMock.Setup(x => x.GetInvoiceByIdAsync(1)).ReturnsAsync(invoice);
        _invoiceRepoMock.Setup(x => x.GetTotalPaidForTreatmentRecord(10)).ReturnsAsync(300);

        var handler = CreateHandlerWithContext(user);
        var command = new UpdateInvoiceCommand
        {
            InvoiceId = 1,
            PatientId = 5,
            PaidAmount = 200,
            PaymentMethod = "cash",
            TransactionType = "partial",
            Description = "Thanh toán đợt 1"
        };

        var result = await handler.Handle(command, default);

        Assert.Equal(MessageConstants.MSG.MSG32, result);
        _invoiceRepoMock.Verify(x => x.UpdateInvoiceAsync(It.IsAny<Invoice>()), Times.Once);
        // Không verify _mediator.Send()
    }
}