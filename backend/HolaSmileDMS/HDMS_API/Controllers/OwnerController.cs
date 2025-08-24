using Application.Constants;
using Application.Usecases.Owner.ViewDashboard;
using Application.Usecases.Owner.ViewDashBoard;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers
{
    [Route("api/owner")]
    [ApiController]
    //[Authorize(Roles = "Owner")]
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
            try
            {
                var result = await _mediator.Send(new ViewDashboardCommand
                {
                    Filter = filter
                });

                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    message = MessageConstants.MSG.MSG26
                });
            }           
        }

        [HttpGet("column-chart")]
        public async Task<IActionResult> GetColumnChart([FromQuery] string? filter)
        {
            var command = new ColumnChartCommand
            {
                Filter = filter
            };

            var result = await _mediator.Send(command);
            return Ok(result);
        }

        [HttpGet("line-chart")]
        public async Task<IActionResult> GetLineChart([FromQuery] string? filter)
        {
            var result = await _mediator.Send(new LineChartCommand(filter));
            return Ok(result);
        }

        [HttpGet("pie-chart")]
        public async Task<IActionResult> GetPieChart([FromQuery] string? filter)
        {
            var result = await _mediator.Send(new PieChartCommand(filter));
            return Ok(result);
        }
    }
}
