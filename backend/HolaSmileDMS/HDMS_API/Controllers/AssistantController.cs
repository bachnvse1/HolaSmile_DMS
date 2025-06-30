using Application.Constants;
using Application.Usecases.Assistant.ViewAssignedTasks;
using Application.Usecases.Assistant.ViewTaskDetails;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers
{
    [Route("api/assistant")]
    [ApiController]
    public class AssistantController : ControllerBase
    {
        private readonly IMediator _mediator;

        public AssistantController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("tasks")]
        [Authorize(Roles = "Assistant")]
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

        [HttpGet("tasks/{id}")]
        [Authorize]
        public async Task<IActionResult> ViewTaskDetails(int id)
        {
            try
            {
                var result = await _mediator.Send(new ViewTaskDetailsCommand(id));
                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    message = MessageConstants.MSG.MSG26 // Bạn không có quyền truy cập
                });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new
                {
                    message = MessageConstants.MSG.MSG16 // Không có dữ liệu phù hợp
                });
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = MessageConstants.MSG.MSG58 // Cập nhật dữ liệu thất bại
                });
            }
        }


    }
}
