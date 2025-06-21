using Application.Constants;
using Application.Usecases.UserCommon.ViewListPatient;
using HDMS_API.Infrastructure.Persistence;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers
{
    [Route("api/patient")]
    [ApiController]
    public class PatientController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMediator _mediator;
        public PatientController(ApplicationDbContext context, IMediator mediator)
        {
            _context = context;
            _mediator = mediator;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> ViewPatientList()
        {
            try
            {
                var result = await _mediator.Send(new ViewListPatientCommand());

                if (result == null || !result.Any())
                    return Ok(new { message = MessageConstants.MSG.MSG16 });

                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = MessageConstants.MSG.MSG58 });
            }
        }
    }
}
