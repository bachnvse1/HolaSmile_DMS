using Application.Constants;
using Application.Usecases.Assistant.CreateSupply;
using Application.Usecases.Assistant.DeleteAndUndeleteSupply;
using Application.Usecases.Assistant.EditSupply;
using Application.Usecases.UserCommon.ViewSupplies;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers
{
    [Route("api/supplies")]
    [ApiController]
    public class SuppliesController : ControllerBase
    {
        private readonly IMediator _mediator;
        public SuppliesController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [Authorize]
        [HttpGet("ListSupplies")]
        public async Task<IActionResult> GetListSupplies()
        {
            try
            {
                var result = await _mediator.Send(new ViewListSuppliesCommand());
                return result == null ? NotFound(MessageConstants.MSG.MSG16) : Ok(result);
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
                    Error = "An unexpected error occurred: " + ex.Message
                });
            }
        }

        [Authorize]
        [HttpGet("{supplyId}")]
        public async Task<IActionResult> GetListSupplies([FromRoute] int supplyId, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(new ViewDetailSupplyCommand { SupplyId = supplyId});
                return result == null ? NotFound(MessageConstants.MSG.MSG16) : Ok(result);
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
                    Error = "An unexpected error occurred: " + ex.Message
                });
            }
        }

        [Authorize]
        [HttpPost("createSupply")]
        public async Task<IActionResult> CreateSupply([FromBody] CreateSupplyCommand command)
        {
            if (command == null)
            {
                return BadRequest("Invalid supply data.");
            }
            try
            {
                var result = await _mediator.Send(command);
                return result ? Ok(MessageConstants.MSG.MSG67) : Conflict(MessageConstants.MSG.MSG58);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    Message = false,
                    Error = ex.Message
                });
            }
            catch(ArgumentException ex)
            {
                return BadRequest(new
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
                    Error = "An unexpected error occurred: " + ex.Message
                });
            }
        }

        [Authorize]
        [HttpPut("editSupply")]
        public async Task<IActionResult> EditSupply([FromBody] EditSupplyCommand command)
        {
            if (command == null)
            {
                return BadRequest("Invalid supply data.");
            }
            try
            {
                var result = await _mediator.Send(command);
                return result ? Ok(MessageConstants.MSG.MSG68) : Conflict(MessageConstants.MSG.MSG58);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    Message = false,
                    Error = ex.Message
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new
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
                    Error = "An unexpected error occurred: " + ex.Message
                });
            }
        }

        [Authorize]
        [HttpPut("DeleteandUndeleteSupply/{supplyId}")]
        public async Task<IActionResult> EditSupply([FromRoute] int supplyId, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(new DeleteAndUndeleteSupplyCommand { SupplyId = supplyId });
                return result ? Ok(MessageConstants.MSG.MSG68) : Conflict(MessageConstants.MSG.MSG58);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    Message = false,
                    Error = ex.Message
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new
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
                    Error = "An unexpected error occurred: " + ex.Message
                });
            }
        }

    }
}
