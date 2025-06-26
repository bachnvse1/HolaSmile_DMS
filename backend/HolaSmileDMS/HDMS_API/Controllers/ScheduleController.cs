using Application.Usecases.Dentist.ManageSchedule;
using Application.Usecases.Dentist.UpdateSchedule;
using Application.Usecases.Dentist.ViewDentistSchedule;
using Application.Usecases.Owner;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers
{
    [Route("api/schedule")]
    [ApiController]
    public class ScheduleController : ControllerBase
    {
        private readonly IMediator _mediator;
        public ScheduleController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("dentist/available")]
        public async Task<IActionResult> GetAllAvailableDentistSchedule()
        {
            try
            {
                var result = await _mediator.Send(new ViewAllAvailableDentistScheduleCommand());
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

        [HttpGet("dentist/list")]
        public async Task<IActionResult> GetAllDentistSchedule()
        {
            try
            {
                var result = await _mediator.Send(new ViewAllDentistScheduleCommand());
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

        [HttpGet("dentist/{dentistId}")]
        public async Task<IActionResult> ViewDentistSchedule([FromRoute] int dentistId, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(new ViewDentistScheduleCommand { DentistId = dentistId });
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

        [HttpPost("dentist/create")]
        public async Task<IActionResult> CreateSchedule([FromBody] CreateScheduleCommand command, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(command, cancellationToken);
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
        [HttpPut("dentist/edit")]
        public async Task<IActionResult> EditSchedule([FromBody] EditScheduleCommand command, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(command, cancellationToken);
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

        [HttpPut("dentist/approve")]
        public async Task<IActionResult> ApproveDentistSchedule([FromBody] ApproveDentistScheduleCommand command, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(command, cancellationToken);
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
