using Application.Usecases.Dentist.AssignTasksToAssistantHandler;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Application.Constants;
using Application.Usecases.Assistant.ViewAssignedTasks;
using Application.Usecases.Assistant.UpdateTaskStatus;

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

        [HttpGet("tasks")]
        [Authorize]
        public async Task<IActionResult> ViewAssignedTasks()
        {
            try
            {
                var result = await _mediator.Send(new ViewAssignedTasksCommand());

                if (result == null || !result.Any())
                    return Ok(new { message = MessageConstants.MSG.MSG16 }); // "Không có dữ liệu phù hợp"

                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    message = MessageConstants.MSG.MSG26 // "Bạn không có quyền truy cập chức năng này"
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    message = MessageConstants.MSG.MSG58 // "Cập nhật dữ liệu thất bại" (hoặc có thể là lỗi hệ thống không xác định)
                });
            }
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

        [HttpPut("tasks/{id}/status")]
        [Authorize]
        public async Task<IActionResult> UpdateTaskStatus(int id, [FromBody] bool status)
        {
            try
            {
                var result = await _mediator.Send(new UpdateTaskStatusCommand
                {
                    TaskId = id,
                    Status = status
                });

                return Ok(new { message = result });
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = MessageConstants.MSG.MSG26 });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = MessageConstants.MSG.MSG16 });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = MessageConstants.MSG.MSG58 });
            }
        }

    }
}
