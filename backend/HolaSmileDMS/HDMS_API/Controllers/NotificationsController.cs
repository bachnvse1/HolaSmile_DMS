using Application.Constants;
using Application.Usecases.UserCommon.ViewNotification;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers
{
    [Route("api/notifications")]
    [ApiController]
    public class NotificationsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public NotificationsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetNotifications(CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(new ViewNotificationCommand(), cancellationToken);

                if (result == null || !result.Any())
                    return Ok(new { message = MessageConstants.MSG.MSG16 });

                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = MessageConstants.MSG.MSG58 });
            }
        }

    }
}
