using Application.Usecases.UserCommon.ViewAppointment;
using Application.Usecases.Patients.CancelAppointment;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers
{
    [Route("api/appointment")]
    [ApiController]
    public class AppointmentController : ControllerBase
    {
        private readonly IMediator _mediator;
        public AppointmentController(IMediator mediator)
        {
            _mediator = mediator;
        }
        [Authorize]
        [HttpGet]
        [Route("listappointment")]
        public async Task<IActionResult> GetAppointment(CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(new ViewAppointmentCommand(), cancellationToken);
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

        [HttpGet("Appointment/{appointmentId}")]
        public async Task<IActionResult> ViewDetailAppointment([FromRoute] int appointmentId, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(new ViewDetailAppointmentCommand(appointmentId), cancellationToken);
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
        [HttpPut]

        [Route("Appointment/{appointmentId}")]
        public async Task<IActionResult> ViewDetailPatientAppointment([FromRoute] int appointmentId, CancellationToken cancellationToken)
            {
            try
            {
                var result = await _mediator.Send(new CancleAppointmentCommand(appointmentId), cancellationToken);
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
