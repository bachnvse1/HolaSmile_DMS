using Application.Usecases.Guests.BookAppointment;
using HDMS_API.Application.Usecases.Guests.BookAppointment;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers
{
    [Route("api/Guest")]
    [ApiController]
    public class GuestsController : ControllerBase
    {
        private readonly IMediator _mediator;
        public GuestsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost("BookAppointment")]
        public async Task<IActionResult> BookAppointment([FromBody] BookAppointmentCommand command)
        {
            if (command == null)
            {
                return BadRequest("Dữ liệu đầu vào không hợp lệ.");
            }
            try
            {
                var result = await _mediator.Send(command);
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

        [HttpPost("ValidateBookAppointment")]
        public async Task<IActionResult> ValidateBookAppointment([FromBody] ValidateBookAppointmentCommand command)
        {
            if (command == null)
            {
                return BadRequest("Dữ liệu đầu vào không hợp lệ.");
            }
            try
            {
                var result = await _mediator.Send(command);
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
