using Application.Services;
using Application.Usecases.Patients.ViewDentalRecord;
using HDMS_API.Controllers;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Patients.PrintDentalRecord;

public class PrintDentalRecordControllerTests
{
    private readonly Mock<IMediator> _mediatorMock;
    private readonly Mock<IPdfGenerator> _pdfGeneratorMock;
    private readonly Mock<IPrinter> _printerMock;
    private readonly PatientController _controller;

    public PrintDentalRecordControllerTests()
    {
        _mediatorMock = new Mock<IMediator>();
        _pdfGeneratorMock = new Mock<IPdfGenerator>();
        _printerMock = new Mock<IPrinter>();
        
        _controller = new PatientController(
            _mediatorMock.Object,
            _pdfGeneratorMock.Object,
            _printerMock.Object
        );
    }

    [Fact(DisplayName = "UTCID01 - Return PDF successfully")]
    public async System.Threading.Tasks.Task UTCID01_ReturnsPdfSuccessfully()
    {
        // Arrange
        var appointmentId = 1;
        var sheetDto = new DentalExamSheetDto
        {
            AppointmentId = appointmentId,
            Treatments = new List<TreatmentRowDto>()
        };

        _mediatorMock.Setup(m => m.Send(It.IsAny<ViewDentalExamSheetCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(sheetDto);

        _printerMock.Setup(p => p.RenderDentalExamSheetToHtml(sheetDto))
            .Returns("<html></html>");

        _pdfGeneratorMock.Setup(p => p.GeneratePdf(It.IsAny<string>()))
            .Returns(new byte[] { 1, 2, 3 });

        // Act
        var result = await _controller.PrintDentalRecord(appointmentId);

        // Assert
        var fileResult = Assert.IsType<FileContentResult>(result);
        Assert.Equal("application/pdf", fileResult.ContentType);
        Assert.Equal($"DentalRecord_{appointmentId}.pdf", fileResult.FileDownloadName);
    }

    [Fact(DisplayName = "UTCID02 - Unauthorized access throws exception")]
    public async System.Threading.Tasks.Task UTCID02_UnauthorizedAccessThrowsException()
    {
        // Arrange
        var appointmentId = 1;
        _mediatorMock.Setup(m => m.Send(It.IsAny<ViewDentalExamSheetCommand>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new UnauthorizedAccessException("MSG17"));

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _controller.PrintDentalRecord(appointmentId));
    }
}