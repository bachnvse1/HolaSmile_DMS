using Application.Usecases.Assistants.CreateInstruction;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers
{
    [Authorize(Roles = "Assistant")]
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
            var result = await _mediator.Send(command);
            return Ok(new { message = result });
        }
    }
}
