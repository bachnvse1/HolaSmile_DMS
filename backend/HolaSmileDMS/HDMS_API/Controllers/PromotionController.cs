using Application.Constants;
using Application.Usecases.Receptionist.CreateDiscountProgram;
using Application.Usecases.Receptionist.De_ActivePromotion;
using Application.Usecases.Receptionist.UpdateDiscountProgram;
using Application.Usecases.Receptionist.ViewPromotionProgram;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers
{
    [Route("api/promotion")]
    [ApiController]
    public class PromotionController : ControllerBase
    {
        private readonly IMediator _mediator;

        public PromotionController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [Authorize]
        [HttpGet("list-promotion-programs")]
        public async Task<IActionResult> GetAllPromotionPrograms()
        {
            try
            {
                var result = await _mediator.Send(new ViewPromotionProgramCommand());
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    status = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    status = false,
                    message = ex.Message
                });
            }
        }

        [Authorize]
        [HttpGet("promotion-program/{ProgramId}")]
        public async Task<IActionResult> GetPromotionProgramById([FromRoute] int ProgramId)
        {
            try
            {
                var result = await _mediator.Send(new ViewDetailPromotionProgramCommand(ProgramId));
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    status = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    status = false,
                    message = ex.Message
                });
            }
        }

        [Authorize]
        [HttpPost("create-discount-program")]
        public async Task<IActionResult> CreateDiscountProgram([FromBody] CreateDiscountProgramCommand command)
        {
            try
            {
                var result = await _mediator.Send(command);
                return result
                    ? Ok(new { status = true, message = MessageConstants.MSG.MSG117 })
                    : Conflict(new { status = false, message = MessageConstants.MSG.MSG58 });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    status = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    status = false,
                    message = ex.Message
                });
            }
        }

        [Authorize]
        [HttpPut("update-promotion-program")]
        public async Task<IActionResult> UpdatePromotionProgram([FromBody] UpdateDiscountProgramCommand command)
        {
            try
            {
                var result = await _mediator.Send(command);
                return result
                    ? Ok(new { status = true, message = MessageConstants.MSG.MSG120 })
                    : Conflict(new { status = false, message = MessageConstants.MSG.MSG58 });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    status = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    status = false,
                    message = ex.Message
                });
            }
        }

        [Authorize]
        [HttpPut("deactive-promotion-program/{ProgramId}")]
        public async Task<IActionResult> DeletePromotionProgram([FromRoute] int ProgramId)
        {
            try
            {
                var result = await _mediator.Send(new DeactivePromotionCommand(ProgramId));
                return result
                    ? Ok(new { status = true, message = MessageConstants.MSG.MSG31 })
                    : Conflict(new { status = false, message = MessageConstants.MSG.MSG58 });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    status = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    status = false,
                    message = ex.Message
                });
            }
        }
    }
}
