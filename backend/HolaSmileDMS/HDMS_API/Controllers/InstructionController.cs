using Application.Usecases.Assistants.CreateInstruction;
using Application.Usecases.Assistants.DeactiveInstruction;
using Application.Usecases.Assistants.UpdateInstruction;
using Application.Usecases.Assistants.ViewListInstruction;
using Application.Usecases.Patients.ViewInstruction;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/instruction")]
    public class InstructionController : ControllerBase
    {
        private readonly IMediator _mediator;

        public InstructionController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateInstruction([FromBody] CreateInstructionCommand command)
        {
            try
            {
                var result = await _mediator.Send(command);
                return Ok(new { message = result });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
            }
        }

        [HttpGet("patient/list")]
        [Authorize]
        public async Task<IActionResult> GetPatientInstructions([FromQuery] int? appointmentId)
        {
            try
            {
                var result = await _mediator.Send(new ViewInstructionCommand(appointmentId));
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                // Trả về 403 với message từ Handler
                return StatusCode(403, new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                // Trả về 404 với message từ Handler
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                // Trả về 400 với message từ Handler (hoặc lỗi hệ thống)
                return BadRequest(new { message = ex.Message });
            }
        }
        [HttpPut("update")]
        [Authorize(Roles = "Assistant,Dentist")]
        public async Task<IActionResult> UpdateInstruction([FromBody] UpdateInstructionCommand command)
        {
            try
            {
                var result = await _mediator.Send(command);
                return Ok(new { message = result });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("deactive")]
        [Authorize(Roles = "Assistant,Dentist")]
        public async Task<IActionResult> DeactiveInstruction([FromBody] DeactiveInstructionCommand command)
        {
            try
            {
                var result = await _mediator.Send(command);
                return Ok(new { message = result });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet]
        [Authorize(Roles = "Assistant,Dentist")]
        public async Task<IActionResult> GetInstructions()
        {
            try
            {
                var result = await _mediator.Send(new ViewListInstructionCommand());
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

    }
}
