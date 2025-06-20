using Application.Usecases.Dentist.ViewDentistSchedule;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers
{
    [Route("api/Dentist")]
    [ApiController]
    public class DentistController : ControllerBase
    {
        private readonly IMediator _mediator;
        public DentistController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("Schedule/AllDentistSchedule")]
        public async Task<IActionResult> GetAllDentistSchedule()
        {
            try
            {
                var result = await _mediator.Send(new ViewDentistScheduleCommand());
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
