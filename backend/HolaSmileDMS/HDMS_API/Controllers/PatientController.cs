using Application.Constants;
using Application.Services;
using Application.Usecases.Patients.ViewDentalRecord;
using Application.Usecases.Patients.ViewListPatient;
using Application.Usecases.UserCommon.ViewListPatient;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers
{
    [Route("api/patient")]
    [ApiController]
    public class PatientController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IPdfGenerator _pdfGenerator;
        private readonly IPrinter _printer;

        public PatientController(IMediator mediator, IPdfGenerator pdfGenerator, IPrinter printer)
        {
            _mediator = mediator;
            _pdfGenerator = pdfGenerator;
            _printer = printer;
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> ViewPatientList()
        {
            try
            {
                var result = await _mediator.Send(new ViewListPatientCommand());

                if (result == null || !result.Any())
                    return Ok(new { message = MessageConstants.MSG.MSG16 });

                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    message = MessageConstants.MSG.MSG26
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = MessageConstants.MSG.MSG58 });
            }
        }

        [Authorize]
        [HttpGet("{id}")]
        public async Task<IActionResult> ViewDetailPatient(int id)
        {
            try
            {
                var result = await _mediator.Send(new ViewDetailPatientCommand { PatientId = id });

                return Ok(result);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = MessageConstants.MSG.MSG12 }); // Không tìm thấy bệnh nhân
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    message = MessageConstants.MSG.MSG26
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = MessageConstants.MSG.MSG58 });
            }
        }
        
        [HttpGet("DentalRecord/{AppointmentId}")]
        [Authorize]
        public async Task<IActionResult> ViewDentalRecord(int AppointmentId)
        {
            var result = await _mediator.Send(new ViewDentalExamSheetCommand(AppointmentId));
            return Ok(result);
        }
        
        [HttpGet("DentalRecord/Print/{AppointmentId}")]
        [Authorize]
        public async Task<IActionResult> PrintDentalRecord(int AppointmentId)
        {
            var sheet = await _mediator.Send(new ViewDentalExamSheetCommand(AppointmentId));
            var htmlContent = _printer.RenderDentalExamSheetToHtml(sheet);
            var pdfBytes = _pdfGenerator.GeneratePdf(htmlContent);
    
            return File(pdfBytes, "application/pdf", $"DentalRecord_{AppointmentId}.pdf");
        }

    }
}