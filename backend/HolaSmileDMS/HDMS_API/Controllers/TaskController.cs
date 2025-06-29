using Application.Usecases.Dentist.AssignTasksToAssistantHandler;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Application.Constants;

namespace HDMS_API.Controllers
{
    [Route("api/task")]
    [ApiController]
    public class TaskController : ControllerBase
    {
        private readonly IMediator _mediator;

        public TaskController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost("assign-task")]
        [Authorize]
        public async Task<IActionResult> AssignTaskToAssistant([FromBody] AssignTaskToAssistantCommand command)
        {
            try
            {
                var result = await _mediator.Send(command);
                return Ok(new { message = result }); // ✅ result ở đây là MSG từ handler
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    message = MessageConstants.MSG.MSG26 // "Bạn không có quyền truy cập chức năng này"
                });
            }
            catch (FormatException)
            {
                return BadRequest(new
                {
                    message = MessageConstants.MSG.MSG91 // "Định dạng thời gian không hợp lệ..."
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    message = MessageConstants.MSG.MSG58 // "Cập nhật dữ liệu thất bại"
                });
            }
        }
    }
}
