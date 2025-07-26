using Application.Services;
using Application.Usecases.Patients.ViewInvoices;
using HDMS_API.Controllers;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Patients.PrintInvoice;

 public class PrintInvoiceControllerTests
    {
        private readonly Mock<IMediator> _mediatorMock;
        private readonly Mock<IPdfGenerator> _pdfGeneratorMock;
        private readonly Mock<IPrinter> _printerMock;
        private readonly InvoiceController _controller;

        public PrintInvoiceControllerTests()
        {
            _mediatorMock = new Mock<IMediator>();
            _pdfGeneratorMock = new Mock<IPdfGenerator>();
            _printerMock = new Mock<IPrinter>();

            _controller = new InvoiceController(
                _mediatorMock.Object,
                _pdfGeneratorMock.Object,
                _printerMock.Object
            );
        }

        [Fact(DisplayName = "UTCID01 - Print invoice successfully")]
        public async System.Threading.Tasks.Task UTCID01_PrintInvoice_Success()
        {
            // Arrange
            var invoiceId = 1;
            var dto = new ViewInvoiceDto { InvoiceId = invoiceId, PatientId = 1 };

            _mediatorMock.Setup(m => m.Send(It.IsAny<ViewDetailInvoiceCommand>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(dto);

            _printerMock.Setup(p => p.RenderInvoiceToHtml(dto)).Returns("<html></html>");
            _pdfGeneratorMock.Setup(p => p.GeneratePdf(It.IsAny<string>())).Returns(new byte[] { 1, 2, 3 });

            // Act
            var result = await _controller.PrintInvoice(invoiceId);

            // Assert
            var fileResult = Assert.IsType<FileContentResult>(result);
            Assert.Equal("application/pdf", fileResult.ContentType);
            Assert.Equal($"Invoice_{invoiceId}.pdf", fileResult.FileDownloadName);
        }

        [Fact(DisplayName = "UTCID02 - Unauthorized when patient tries to print others' invoice")]
        public async System.Threading.Tasks.Task UTCID02_PrintInvoice_Unauthorized()
        {
            // Arrange
            var invoiceId = 1;
            _mediatorMock.Setup(m => m.Send(It.IsAny<ViewDetailInvoiceCommand>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new UnauthorizedAccessException("MSG26"));

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _controller.PrintInvoice(invoiceId));
        }
    }