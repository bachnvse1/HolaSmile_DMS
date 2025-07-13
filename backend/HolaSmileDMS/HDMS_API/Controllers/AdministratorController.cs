using Application.Constants;
using Application.Usecases.Administrator.BanAndUnban;
using Application.Usecases.Administrator.CreateUser;
using Application.Usecases.Administrator.ViewListUser;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers
{
    [Route("api/administrator")]
    [ApiController]
    public class AdministratorController : ControllerBase
    {
        private readonly IMediator _mediator;
        public AdministratorController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [Authorize]
        [HttpGet("view-list-user")]
        public async Task<IActionResult> ViewListUser(CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(new ViewListUserCommand(), cancellationToken);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    ex.Message,
                    Inner = ex.InnerException?.Message,
                    Stack = ex.StackTrace
                });
            }
        }

        [Authorize]
        [HttpPost("create-user")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserCommand command, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(command, cancellationToken);
                return result ? Ok(MessageConstants.MSG.MSG21) : Conflict(MessageConstants.MSG.MSG76);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    ex.Message,
                    Inner = ex.InnerException?.Message,
                    Stack = ex.StackTrace
                });
            }
        }

        [Authorize]
        [HttpPut("ban-unban-user")]
        public async Task<IActionResult> BanAndUnbanUser([FromBody] BanAndUnbanUserCommand command, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(command, cancellationToken);
                return result ? Ok(MessageConstants.MSG.MSG09) : Conflict(MessageConstants.MSG.MSG58);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    ex.Message,
                    Inner = ex.InnerException?.Message,
                    Stack = ex.StackTrace
                });
            }
        }
    }
}
