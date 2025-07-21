using HDMS_API.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HDMS_API.Controllers;

[ApiController]
[Route("api/chats")]
public class ChatController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ChatController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetChatHistory([FromQuery] string user1, [FromQuery] string user2)
    {
        if (string.IsNullOrWhiteSpace(user1) || string.IsNullOrWhiteSpace(user2))
        {
            return BadRequest("Both user1 and user2 must be provided.");
        }

        try
        {
            var messages = await _context.ChatMessages
                .Where(m => (m.SenderId == user1 && m.ReceiverId == user2)
                            || (m.SenderId == user2 && m.ReceiverId == user1))
                .OrderBy(m => m.Timestamp)
                .ToListAsync();

            return Ok(messages);
        }
        catch (Exception ex)
        {
            // Log the exception (logging not shown here)
            return StatusCode(500, "An error occurred while retrieving chat history.");
        }
    }
}