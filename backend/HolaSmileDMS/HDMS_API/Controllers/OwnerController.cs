using Application.Usecases.Owner.ViewDashboard;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers
{
    [Route("api/owner")]
    [ApiController]
    [Authorize(Roles = "Owner")]
    public class OwnerController : ControllerBase
    {
        private readonly IMediator _mediator;

        public OwnerController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> ViewDashboard([FromQuery] string? filter)
        {
            var result = await _mediator.Send(new ViewDashboardCommand
            {
                Filter = filter
            });

            return Ok(result);
        }
    }
}
