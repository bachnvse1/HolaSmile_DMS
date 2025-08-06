using Application.Constants;
using Application.Usecases.Administrators.ChatbotData;
using Application.Usecases.Administrators.UpdateChatbotData;
using Application.Usecases.Guests.AskChatBot;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers
{
    [Route("api/chatbot")]
    [ApiController]
    public class ChatbotController : ControllerBase
    {

        private readonly IMediator _mediator;

        public ChatbotController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {

            try
            {
                var response = await _mediator.Send(new GetAllDataChatBotCommand());
                return Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    status = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    status = false,
                    message = ex.Message
                });
            }
        }

        [HttpPut]
        public async Task<IActionResult> Ask([FromBody] string userQuestion)
        {
            try
            {
                var answer = await _mediator.Send(new AskChatbotCommand(userQuestion));
                return Ok(answer);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    status = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    status = false,
                    message = ex.Message
                });
            }
        }

        [HttpPost("update")]
        public async Task<IActionResult> UpdateChatbotData([FromBody] UpdateChatbotDataCommand command)
        {
            try
            {
                var isUpdated = await _mediator.Send(command);
                return isUpdated ? Ok(MessageConstants.MSG.MSG131) : Conflict(MessageConstants.MSG.MSG58);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    status = false,
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    status = false,
                    message = ex.Message
                });
            }
        }


    }
}
