using Application.Constants;
using Application.Usecases.Assistant.ViewPrescriptionTemplate;
using Application.Usecases.Assistants.UpdatePrescriptionTemplate;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers
{
    [ApiController]
    [Route("api/prescription-templates")]
    public class PrescriptionTemplateController : ControllerBase
    {
        private readonly IMediator _mediator;

        public PrescriptionTemplateController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAllPrescriptionTemplates()
        {
            try
            {
                var result = await _mediator.Send(new ViewPrescriptionTemplateCommand());

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

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdatePrescriptionTemplate(int id, [FromBody] UpdatePrescriptionTemplateCommand command)
        {
            try
            {
                if (id != command.PreTemplateID)
                    return BadRequest(new { message = MessageConstants.MSG.MSG57 }); // "Dữ liệu không hợp lệ"

                var result = await _mediator.Send(command);
                return Ok(new { message = result });
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = MessageConstants.MSG.MSG26 });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = MessageConstants.MSG.MSG15 });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = MessageConstants.MSG.MSG58 });
            }
        }

    }
}
