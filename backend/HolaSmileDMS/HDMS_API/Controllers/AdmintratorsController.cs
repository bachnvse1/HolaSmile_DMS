using Application.Usecases.Admintrator;
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

    }
}
