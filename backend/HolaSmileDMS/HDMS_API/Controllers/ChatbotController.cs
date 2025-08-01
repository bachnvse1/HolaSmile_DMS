using System.Text;
using System.Text.Json;
using Application.Usecases.Guests.AskChatBot;
using MediatR;
using Microsoft.AspNetCore.Http;
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

        [HttpPost]
        public async Task<IActionResult> Ask([FromBody] string userQuestion)
        {
            var answer = await _mediator.Send(new AskChatbotCommand(userQuestion));
            return Ok(answer);
        }

    }
}
