using Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HDMS_API.Controllers;

[ApiController]
[Route("api/chats")]
public class ChatController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICloudinaryService _cloudService;
    public ChatController(ApplicationDbContext context, ICloudinaryService cloudService)
    {
        _context = context;
        _cloudService = cloudService;
    }

    /// <summary>
    /// Lấy lịch sử chat giữa hai người dùng (theo thời gian tăng dần).
    /// </summary>
    [HttpGet("history")]
    public async Task<IActionResult> GetChatHistory([FromQuery] string user1, [FromQuery] string user2)
    {
        if (string.IsNullOrWhiteSpace(user1) || string.IsNullOrWhiteSpace(user2))
            return BadRequest("Both user1 and user2 must be provided.");

        try
        {
            var messages = await _context.ChatMessages
                .Where(m => (m.SenderId == user1 && m.ReceiverId == user2)
                         || (m.SenderId == user2 && m.ReceiverId == user1))
                .OrderBy(m => m.Timestamp)
                .ToListAsync();

            return Ok(messages);
        }
        catch (Exception)
        {
            return StatusCode(500, "An error occurred while retrieving chat history.");
        }
    }

    /// <summary>
    /// Lấy số lượng tin nhắn chưa đọc, nhóm theo từng người gửi (dùng cho thông báo).
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadMessageCount([FromQuery] string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return BadRequest("User ID is required.");

        try
        {
            var unreadCounts = await _context.ChatMessages
                .Where(m => m.ReceiverId == userId && !m.IsRead)
                .GroupBy(m => m.SenderId)
                .Select(g => new
                {
                    SenderId = g.Key,
                    UnreadCount = g.Count()
                })
                .ToListAsync();

            return Ok(unreadCounts);
        }
        catch (Exception)
        {
            return StatusCode(500, "An error occurred while retrieving unread message counts.");
        }
    }

    /// <summary>
    /// Đánh dấu toàn bộ tin nhắn từ Sender gửi tới Receiver là đã đọc.
    /// </summary>
    [HttpPost("mark-as-read")]
    public async Task<IActionResult> MarkMessagesAsRead([FromBody] MarkAsReadDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.SenderId) || string.IsNullOrWhiteSpace(dto.ReceiverId))
            return BadRequest("SenderId and ReceiverId are required.");

        try
        {
            var updatedRows = await _context.ChatMessages
                .Where(m => m.SenderId == dto.SenderId
                         && m.ReceiverId == dto.ReceiverId
                         && !m.IsRead)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(m => m.IsRead, true));

            return Ok(new { Message = "Messages marked as read.", Affected = updatedRows });
        }
        catch (Exception)
        {
            return StatusCode(500, "An error occurred while marking messages as read.");
        }
    }
    
    [HttpPost("upload-media")]
    public async Task<IActionResult> UploadMedia([FromForm] IFormFile file)
    {
        var allowedTypes = new[] { "image/", "video/" };
        if (file == null || !allowedTypes.Any(t => file.ContentType.StartsWith(t)))
            return BadRequest("File phải là ảnh hoặc video!");

        var url = await _cloudService.UploadImageAsync(file); // UploadImageAsync cũng dùng cho video (rename lại nếu muốn)
        return Ok(new { url });
    }

    public class MarkAsReadDto
    {
        public string SenderId { get; set; }
        public string ReceiverId { get; set; }
    }
}