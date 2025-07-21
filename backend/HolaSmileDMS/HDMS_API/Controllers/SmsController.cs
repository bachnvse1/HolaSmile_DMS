using Application.Usecases.Receptionist.SMS;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers
{
    [Route("api/Sms")]
    [ApiController]
    public class SmsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public SmsController(IMediator mediator)
        {
            _mediator = mediator;
        }
        [HttpPost("send-reminder")]
        public async Task<IActionResult> SendReminderSms([FromBody] SendReminderSmsCommand command)
        {
            try
            {
                var result = await _mediator.Send(command);
                if (result)
                {
                    return Ok(new { message = "SMS nhắc lịch khám đã được gửi thành công." });
                }
                else
                {
                    return BadRequest(new { message = "Gửi SMS nhắc lịch khám thất bại." });
                }
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "Bạn không có quyền truy cập chức năng này." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi hệ thống: " + ex.Message });
            }
        }
    }
}
