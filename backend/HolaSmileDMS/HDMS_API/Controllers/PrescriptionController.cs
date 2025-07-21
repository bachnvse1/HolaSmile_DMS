using Application.Constants;
using Application.Usecases.Dentists.CreatePrescription;
using Application.Usecases.Dentists.EditPrescription;
using Application.Usecases.UserCommon.ViewPatientPrescription;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers
{
    [Route("api/prescription")]
    [ApiController]
    public class PrescriptionController : ControllerBase
    {
        private readonly IMediator _mediator;

        public PrescriptionController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [Authorize]
        [HttpGet("{prescriptionId:int}")]
        public async Task<IActionResult> GetPrescriptions([FromRoute] int prescriptionId)
        {
            try
            {
                var result = await _mediator.Send(new ViewPatientPrescriptionCommand(prescriptionId));
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    Message = false,
                    Error = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    Message = false,
                    Error = ex.Message
                });
            }
        }

        [Authorize]
        [HttpPost("create")]
        public async Task<IActionResult> CreatePrescription([FromBody] CreatePrescriptionCommand command)
        {
            try
            {
                var result = await _mediator.Send(command);
                return result
                    ? Ok(MessageConstants.MSG.MSG62)
                    : BadRequest(MessageConstants.MSG.MSG58);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    Message = false,
                    Error = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    Message = false,
                    Error = ex.Message
                });
            }
        }

        [Authorize]
        [HttpPut("edit")]
        public async Task<IActionResult> EditPrescription([FromBody] EditPrescriptionCommand command)
        {
            try
            {
                var result = await _mediator.Send(command);
                return result
                    ? Ok(MessageConstants.MSG.MSG65)
                    : BadRequest(MessageConstants.MSG.MSG58);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    Message = false,
                    Error = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    Message = false,
                    Error = ex.Message
                });
            }
        }
    }
}
