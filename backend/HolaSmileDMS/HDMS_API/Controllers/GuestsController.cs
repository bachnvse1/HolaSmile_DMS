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
        public async Task<IActionResult> BookAppointment([FromBody] BookAppointmentCommand request)
        {
            if (request == null)
            {
                return BadRequest("Dữ liệu đầu vào không hợp lệ.");
            }
            try
            {
                var result = await _mediator.Send(request);
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
