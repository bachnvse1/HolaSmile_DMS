using Application.Constants;
using Application.Usecases.Admintrator.CreateUser;
using Application.Usecases.Admintrator.ViewListUser;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers
{
    [Route("api/admintrator")]
    [ApiController]
    public class AdmintratorsController : ControllerBase
    {
        private readonly IMediator _mediator;
        public AdmintratorsController(IMediator mediator)
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

        //[Authorize]
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
    }
}
