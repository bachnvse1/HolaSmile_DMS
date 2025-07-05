using Application.Constants;
using Application.Usecases.Assistant.ViewWarrantyCard;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers
{
    [ApiController]
    [Route("api/warranty-cards")]
    public class WarrantyCardController : ControllerBase
    {
        private readonly IMediator _mediator;

        public WarrantyCardController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("patient/{patientId}")]
        [Authorize]
        public async Task<IActionResult> ViewWarrantyCardByPatient(int patientId)
        {
            try
            {
                var result = await _mediator.Send(new ViewWarrantyCardCommand(patientId));
                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = MessageConstants.MSG.MSG26 });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = MessageConstants.MSG.MSG16 });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = MessageConstants.MSG.MSG58 });
            }
        }

    }
}
