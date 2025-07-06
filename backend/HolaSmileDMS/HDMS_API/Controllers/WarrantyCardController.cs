using Application.Constants;
using Application.Usecases.Assistant.CreateWarrantyCard;
using Application.Usecases.Assistant.ViewListWarrantyCards;
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

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAllWarrantyCards()
        {
            try
            {
                var result = await _mediator.Send(new ViewListWarrantyCardsCommand());

                if (result == null || !result.Any())
                    return Ok(new { message = MessageConstants.MSG.MSG16 });

                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = MessageConstants.MSG.MSG26 });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = MessageConstants.MSG.MSG58 });
            }
        }

        [HttpPost("create")]
        [Authorize]
        public async Task<IActionResult> CreateWarrantyCard([FromBody] CreateWarrantyCardCommand command)
        {
            try
            {
                var result = await _mediator.Send(command);
                return Ok(new { message = MessageConstants.MSG.MSG102, data = result });
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = MessageConstants.MSG.MSG26 });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (FormatException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = MessageConstants.MSG.MSG58 });
            }
        }
    }

}
