using Application.Constants;
using Application.Usecases.Patients.ViewListPatient;
using Application.Usecases.UserCommon.ViewListPatient;
using MediatR;
using Microsoft.AspNetCore.Mvc;

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

        [HttpGet]
        public async Task<IActionResult> ViewPatientList()
        {
            try
            {
                var result = await _mediator.Send(new ViewListPatientCommand());

                if (result == null || !result.Any())
                    return Ok(new { message = MessageConstants.MSG.MSG16 });

                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    message = MessageConstants.MSG.MSG26
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = MessageConstants.MSG.MSG58 });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ViewDetailPatient(int id)
        {
            try
            {
                var result = await _mediator.Send(new ViewDetailPatientCommand { PatientId = id });

                return Ok(result);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = MessageConstants.MSG.MSG12 }); // Không tìm thấy bệnh nhân
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    message = MessageConstants.MSG.MSG26
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = MessageConstants.MSG.MSG58 });
            }
        }

    }
}
