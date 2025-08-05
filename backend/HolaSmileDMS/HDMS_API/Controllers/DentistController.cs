using Application.Usecases.Dentist.ViewListDentistName;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers
{
    [Route("api/dentist")]
    [ApiController]
    public class DentistController : ControllerBase
    {
        private readonly IMediator _mediator;
        public DentistController(IMediator mediator)
        {
            _mediator = mediator;
        }

        /// <summary>
        /// Get all active dentists (not deleted)
        /// </summary>
        ///
        [Authorize]
        [HttpGet("getAllDentistsName")]
        public async Task<IActionResult> GetAllDentistsName(CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new ViewDentistListCommand(), cancellationToken);
            return Ok(result);
        }
    }
}
