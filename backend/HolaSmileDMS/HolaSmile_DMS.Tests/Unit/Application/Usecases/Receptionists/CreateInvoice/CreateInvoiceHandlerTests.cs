using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Receptionist.CreateInvoice;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Receptionists;

public class CreateInvoiceHandlerTests
{
    private static CreateInvoiceHandler CreateHandlerWithContext(
        string role,
        int userId,
        int roleTableId,
        Mock<IInvoiceRepository>? invoiceRepoMock = null,
        Mock<ITreatmentRecordRepository>? treatmentRepoMock = null,
        Mock<IPatientRepository>? patientRepoMock = null,
        Mock<IMediator>? mediatorMock = null,
        Mock<ITransactionRepository>? transactionRepoMock = null)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role),
            new Claim("role_table_id", roleTableId.ToString()),
            new Claim(ClaimTypes.GivenName, "Test User")
        };

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        var httpContext = new DefaultHttpContext { User = claimsPrincipal };
        var contextAccessor = new Mock<IHttpContextAccessor>();
        contextAccessor.Setup(c => c.HttpContext).Returns(httpContext);

        return new CreateInvoiceHandler(
            invoiceRepoMock?.Object ?? new Mock<IInvoiceRepository>().Object,
            treatmentRepoMock?.Object ?? new Mock<ITreatmentRecordRepository>().Object,
            contextAccessor.Object,
            patientRepoMock?.Object ?? new Mock<IPatientRepository>().Object,
            mediatorMock?.Object ?? new Mock<IMediator>().Object,
            transactionRepoMock?.Object ?? new Mock<ITransactionRepository>().Object
        );
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID01_RoleNotAllowed_ThrowsUnauthorizedAccessException()
    {
        var handler = CreateHandlerWithContext("Dentist", 1, 1);
        var command = new CreateInvoiceCommand { PatientId = 1 };
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID02_PatientAccessOtherPatient_ThrowsUnauthorizedAccessException()
    {
        var handler = CreateHandlerWithContext("Patient", 1, 99);
        var command = new CreateInvoiceCommand { PatientId = 1 };
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID03_InvalidPaymentMethod_ThrowsArgumentException()
    {
        var handler = CreateHandlerWithContext("Receptionist", 1, 1);
        var command = new CreateInvoiceCommand
        {
            PatientId = 1,
            PaymentMethod = "invalid",
            TransactionType = "full"
        };
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            handler.Handle(command, CancellationToken.None));
        Assert.Contains("Phương thức thanh toán", ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID04_InvalidTransactionType_ThrowsArgumentException()
    {
        var handler = CreateHandlerWithContext("Receptionist", 1, 1);
        var command = new CreateInvoiceCommand
        {
            PatientId = 1,
            PaymentMethod = "PayOS",
            TransactionType = "invalid"
        };
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            handler.Handle(command, CancellationToken.None));
        Assert.Contains("Loại giao dịch", ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID05_TreatmentRecordNotFound_ThrowsException()
    {
        var treatmentRepoMock = new Mock<ITreatmentRecordRepository>();
        treatmentRepoMock.Setup(x => x.GetTreatmentRecordByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TreatmentRecord?)null);

        var handler = CreateHandlerWithContext("Receptionist", 1, 1, treatmentRepoMock: treatmentRepoMock);
        var command = new CreateInvoiceCommand
        {
            PatientId = 1,
            PaymentMethod = "cash",
            TransactionType = "full",
            TreatmentRecordId = 123,
            PaidAmount = 500
        };

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            handler.Handle(command, CancellationToken.None));
        Assert.Equal("Treatment record not found", ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID06_TotalPaidExceedsTotalAmount_ThrowsArgumentException()
    {
        var treatmentRepoMock = new Mock<ITreatmentRecordRepository>();
        treatmentRepoMock.Setup(x => x.GetTreatmentRecordByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TreatmentRecord { TotalAmount = 1000 });

        var invoiceRepoMock = new Mock<IInvoiceRepository>();
        invoiceRepoMock.Setup(x => x.GetTotalPaidForTreatmentRecord(It.IsAny<int>()))
            .ReturnsAsync(900);

        var handler = CreateHandlerWithContext(
            "Receptionist", 1, 1,
            invoiceRepoMock,
            treatmentRepoMock
        );

        var command = new CreateInvoiceCommand
        {
            PatientId = 1,
            TreatmentRecordId = 123,
            PaymentMethod = "PayOS",
            TransactionType = "full",
            PaidAmount = 200
        };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            handler.Handle(command, CancellationToken.None));
        Assert.Contains("Tổng tiền thanh toán vượt quá", ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID07_ValidInput_CreateInvoiceSuccessfully()
    {
        var treatmentRepoMock = new Mock<ITreatmentRecordRepository>();
        treatmentRepoMock.Setup(x => x.GetTreatmentRecordByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TreatmentRecord { TotalAmount = 1000 });

        var invoiceRepoMock = new Mock<IInvoiceRepository>();
        invoiceRepoMock.Setup(x => x.GetTotalPaidForTreatmentRecord(It.IsAny<int>()))
            .ReturnsAsync(300);
        invoiceRepoMock.Setup(x => x.CreateInvoiceAsync(It.IsAny<Invoice>()))
            .Returns(System.Threading.Tasks.Task.CompletedTask);

        var patientRepoMock = new Mock<IPatientRepository>();
        patientRepoMock.Setup(x => x.GetPatientByPatientIdAsync(It.IsAny<int>()))
            .ReturnsAsync(new Patient { UserID = 10 });

        // Không cần verify mediator
        var mediatorMock = new Mock<IMediator>();

        var handler = CreateHandlerWithContext(
            "Receptionist", 1, 1,
            invoiceRepoMock,
            treatmentRepoMock,
            patientRepoMock,
            mediatorMock
        );

        var command = new CreateInvoiceCommand
        {
            PatientId = 1,
            TreatmentRecordId = 123,
            PaymentMethod = "cash",
            TransactionType = "partial",
            PaidAmount = 500,
            Description = "Đợt 1"
        };

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.Equal(MessageConstants.MSG.MSG19, result);
        invoiceRepoMock.Verify(x => x.CreateInvoiceAsync(It.IsAny<Invoice>()), Times.Once);
    }
}