using Application.Usecases.Patient;
using Application.Usecases.UserCommon.Appointment;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Org.BouncyCastle.Utilities;

namespace HDMS_API.Controllers
{
    [Route("api/patient")]
    [ApiController]
    public class PatientController : ControllerBase
    {
        private readonly IMediator _mediator;
        public PatientController(IMediator mediator)
        {
            _mediator = mediator;
        }
        //[Authorize]
        [HttpGet]
        [Route("Appointment")]
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
                var result = await _mediator.Send(new ViewDetailAppointmentCommand { AppointmentId = appointmentId }, cancellationToken);
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
        [Route("Appointment")]
        public async Task<IActionResult> ViewDetailPatientAppointment([FromBody] CancelAppointmentCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(request, cancellationToken);
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
