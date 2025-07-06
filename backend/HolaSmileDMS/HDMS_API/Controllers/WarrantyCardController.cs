using Application.Constants;
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
    }

}
