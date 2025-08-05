using System.Security.Claims;
using Application.Interfaces;
using Application.Usecases.Patients.ViewDentalRecord;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Patients;

public class ViewDentalExamSheetHandlerTests
{
    private readonly Mock<IHttpContextAccessor> _httpMock = new();
    private readonly Mock<IAppointmentRepository> _apptRepo = new();
    private readonly Mock<ITreatmentRecordRepository> _recordRepo = new();
    private readonly Mock<IPatientRepository> _patientRepo = new();
    private readonly Mock<IUserCommonRepository> _userRepo = new();
    private readonly Mock<IDentistRepository> _dentistRepo = new();
    private readonly Mock<IProcedureRepository> _procedureRepo = new();
    private readonly Mock<IWarrantyCardRepository> _warrantyRepo = new();
    private readonly Mock<IInvoiceRepository> _invoiceRepo = new();
    private readonly Mock<IPrescriptionRepository> _prescriptionRepo = new();
    private readonly Mock<IInstructionRepository> _instructionRepo = new();
    private readonly Mock<IAppointmentRepository> _followupRepo = new();

    private ViewDentalExamSheetHandler CreateHandler()
    {
        return new ViewDentalExamSheetHandler(
            _httpMock.Object,
            _apptRepo.Object,
            _recordRepo.Object,
            _patientRepo.Object,
            _userRepo.Object,
            _dentistRepo.Object,
            _procedureRepo.Object,
            _warrantyRepo.Object,
            _invoiceRepo.Object,
            _prescriptionRepo.Object,
            _instructionRepo.Object,
            _followupRepo.Object
        );
    }

    private ClaimsPrincipal MockUser(int userId, string role)
    {
        return new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role)
        }, "mock"));
    }

    [Fact]
    [Trait("UTCID", "UTCID01")]
    public async System.Threading.Tasks.Task Throw_Unauthorized_If_HttpContext_IsNull()
    {
        _httpMock.Setup(x => x.HttpContext).Returns((HttpContext)null!);

        var handler = CreateHandler();
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(new ViewDentalExamSheetCommand(1), CancellationToken.None));
    }

    [Fact]
    [Trait("UTCID", "UTCID02")]
    public async System.Threading.Tasks.Task Throw_Unauthorized_If_Patient_Tries_To_Access_Other_Record()
    {
        var httpCtx = new DefaultHttpContext
        {
            User = MockUser(99, "Patient")
        };
        _httpMock.Setup(x => x.HttpContext).Returns(httpCtx);

        _apptRepo.Setup(x => x.GetAppointmentByIdAsync(1))
            .ReturnsAsync(new Appointment { AppointmentId = 1, PatientId = 2 });

        _patientRepo.Setup(x => x.GetPatientByPatientIdAsync(2))
            .ReturnsAsync(new Patient { PatientID = 2, UserID = 1 });

        var handler = CreateHandler();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(new ViewDentalExamSheetCommand(1), CancellationToken.None));
    }

    [Fact]
    [Trait("UTCID", "UTCID03")]
    public async System.Threading.Tasks.Task Throw_If_Appointment_NotFound()
    {
        var httpCtx = new DefaultHttpContext { User = MockUser(1, "Assistant") };
        _httpMock.Setup(x => x.HttpContext).Returns(httpCtx);

        _apptRepo.Setup(x => x.GetAppointmentByIdAsync(1)).ReturnsAsync((Appointment)null!);

        var handler = CreateHandler();

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            handler.Handle(new ViewDentalExamSheetCommand(1), CancellationToken.None));
    }

    [Fact]
    [Trait("UTCID", "UTCID04")]
    public async System.Threading.Tasks.Task Throw_If_Patient_NotFound()
    {
        _httpMock.Setup(x => x.HttpContext).Returns(new DefaultHttpContext
        {
            User = MockUser(1, "Assistant")
        });

        _apptRepo.Setup(x => x.GetAppointmentByIdAsync(1))
            .ReturnsAsync(new Appointment { AppointmentId = 1, PatientId = 10 });

        _patientRepo.Setup(x => x.GetPatientByPatientIdAsync(10))
            .ReturnsAsync((Patient)null!);

        var handler = CreateHandler();

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            handler.Handle(new ViewDentalExamSheetCommand(1), CancellationToken.None));
    }

    [Fact]
    [Trait("UTCID", "UTCID05")]
    public async System.Threading.Tasks.Task Throw_If_TreatmentRecord_Empty()
    {
        _httpMock.Setup(x => x.HttpContext).Returns(new DefaultHttpContext
        {
            User = MockUser(1, "Assistant")
        });

        _apptRepo.Setup(x => x.GetAppointmentByIdAsync(1))
            .ReturnsAsync(new Appointment { AppointmentId = 1, PatientId = 10 });

        _patientRepo.Setup(x => x.GetPatientByPatientIdAsync(10))
            .ReturnsAsync(new Patient { UserID = 1 });

        _userRepo.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User { Fullname = "A", Phone = "123", DOB = "1990", Address = "X" });

        _recordRepo.Setup(x => x.GetTreatmentRecordsByAppointmentIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TreatmentRecord>());

        var handler = CreateHandler();

        await Assert.ThrowsAsync<Exception>(() =>
            handler.Handle(new ViewDentalExamSheetCommand(1), CancellationToken.None));
    }

    [Fact]
    [Trait("UTCID", "UTCID06")]
    public async System.Threading.Tasks.Task Return_Valid_DentalExamSheet()
    {
        // Arrange HttpContext
        _httpMock.Setup(x => x.HttpContext).Returns(new DefaultHttpContext
        {
            User = MockUser(1, "Assistant")
        });

        var appt = new Appointment { AppointmentId = 1, PatientId = 10, AppointmentDate = DateTime.Today };
        var patient = new Patient { PatientID = 10, UserID = 1 };
        var user = new User { Fullname = "Patient A", Phone = "111", DOB = "1990", Address = "X" };

        _apptRepo.Setup(x => x.GetAppointmentByIdAsync(1)).ReturnsAsync(appt);
        _patientRepo.Setup(x => x.GetPatientByPatientIdAsync(10)).ReturnsAsync(patient);
        _userRepo.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(user);

        _recordRepo.Setup(x => x.GetTreatmentRecordsByAppointmentIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TreatmentRecord> {
                new() { TreatmentRecordID = 100, AppointmentID = appt.AppointmentId, ProcedureID = 2, DentistID = 5, Quantity = 1, UnitPrice = 500, DiscountAmount = 50, TotalAmount = 500, TreatmentDate = DateTime.Today }
            });

        _procedureRepo.Setup(x => x.GetByIdAsync(2, It.IsAny<CancellationToken>())).ReturnsAsync(new Procedure { ProcedureName = "Tẩy trắng" });
        _dentistRepo.Setup(x => x.GetDentistByDentistIdAsync(5)).ReturnsAsync(new Dentist { UserId = 99 });
        _userRepo.Setup(x => x.GetByIdAsync(99, It.IsAny<CancellationToken>())).ReturnsAsync(new User { Fullname = "Dr. X" });

        _invoiceRepo.Setup(x => x.GetByTreatmentRecordIdAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Invoice> {
                new() { PaidAmount = 450, PaymentDate = DateTime.Today }
            });

        _prescriptionRepo.Setup(x => x.GetByTreatmentRecordIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Prescription> {
                new() { Content = "Paracetamol" }
            });

        _instructionRepo.Setup(x => x.GetByTreatmentRecordIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Instruction> {
                new() { Content = "Uống nước nhiều" }
            });

        var handler = CreateHandler();

        // Act
        var result = await handler.Handle(new ViewDentalExamSheetCommand(1), CancellationToken.None);

        // Assert
        Assert.Equal(1, result.AppointmentId);
        Assert.Single(result.Treatments);
        Assert.Single(result.Payments);
        Assert.Equal(500, result.GrandTotal);
        Assert.Equal(50, result.GrandDiscount);
        Assert.Equal(450, result.Paid);
        Assert.Contains("Paracetamol", result.PrescriptionItems);
        Assert.Contains("Uống nước nhiều", result.Instructions);
    }
    
    [Fact]
[Trait("UTCID", "UTCID07")]
public async System.Threading.Tasks.Task Should_Return_Correct_Followup_Information()
{
    // Arrange HttpContext
    _httpMock.Setup(x => x.HttpContext).Returns(new DefaultHttpContext
    {
        User = MockUser(1, "Assistant")
    });

    var appointmentId = 1;

    _apptRepo.Setup(x => x.GetAppointmentByIdAsync(appointmentId))
        .ReturnsAsync(new Appointment { AppointmentId = appointmentId, PatientId = 10 });

    _patientRepo.Setup(x => x.GetPatientByPatientIdAsync(10))
        .ReturnsAsync(new Patient { UserID = 1 });

    _userRepo.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
        .ReturnsAsync(new User { Fullname = "Patient", Phone = "111", DOB = "1990", Address = "123" });

    _recordRepo.Setup(x => x.GetTreatmentRecordsByAppointmentIdAsync(appointmentId, It.IsAny<CancellationToken>()))
        .ReturnsAsync(new List<TreatmentRecord> {
            new() { TreatmentRecordID = 100, ProcedureID = 2, DentistID = 5, Quantity = 1, UnitPrice = 500, DiscountAmount = 50, TotalAmount = 500, TreatmentDate = DateTime.Today }
        });

    _procedureRepo.Setup(x => x.GetByIdAsync(2, It.IsAny<CancellationToken>()))
        .ReturnsAsync(new Procedure { ProcedureName = "Tẩy trắng" });

    _dentistRepo.Setup(x => x.GetDentistByDentistIdAsync(5))
        .ReturnsAsync(new Dentist { UserId = 99 });

    _userRepo.Setup(x => x.GetByIdAsync(99, It.IsAny<CancellationToken>()))
        .ReturnsAsync(new User { Fullname = "Dr. X" });

    _invoiceRepo.Setup(x => x.GetByTreatmentRecordIdAsync(100, It.IsAny<CancellationToken>()))
        .ReturnsAsync(new List<Invoice> {
            new() { PaidAmount = 500, PaymentDate = DateTime.Today }
        });

    _prescriptionRepo.Setup(x => x.GetByTreatmentRecordIdAsync(appointmentId, It.IsAny<CancellationToken>()))
        .ReturnsAsync(new List<Prescription> {
            new() { Content = "Thuốc A" }
        });

    _instructionRepo.Setup(x => x.GetByTreatmentRecordIdAsync(appointmentId, It.IsAny<CancellationToken>()))
        .ReturnsAsync(new List<Instruction> {
            new() { Content = "Hướng dẫn A" }
        });

    // Setup followup appointment
    var nextDate = new DateTime(2025, 12, 25);
    var nextTime = new TimeSpan(14, 30, 0);
    var nextContent = "Hẹn tái khám";

    _followupRepo.Setup(x => x.GetAppointmentByRescheduledFromAppointmentIdAsync(appointmentId))
        .ReturnsAsync(new Appointment
        {
            AppointmentDate = nextDate,
            AppointmentTime = nextTime,
            Content = nextContent
        });

    var handler = CreateHandler();

    // Act
    var result = await handler.Handle(new ViewDentalExamSheetCommand(appointmentId), CancellationToken.None);

    // Assert
    Assert.Equal("14:30 12/25/2025 12:00:00 AM", result.NextAppointmentTime);
    Assert.Equal("Hẹn tái khám", result.NextAppointmentNote);
}
}