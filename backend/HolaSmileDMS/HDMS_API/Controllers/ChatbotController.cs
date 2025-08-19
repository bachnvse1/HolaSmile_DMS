using System.Security.Claims;
using System.Text.Json;
using Application.Constants;
using Application.Interfaces;
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
        private readonly IChatBotKnowledgeRepository _repo;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ChatbotController(IMediator mediator, IChatBotKnowledgeRepository chatBotKnowledgeRepository, IHttpContextAccessor httpContextAccessor)
        {
            _mediator = mediator;
            _repo = chatBotKnowledgeRepository;
            _httpContextAccessor = httpContextAccessor;
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

        [HttpPost]
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

        [HttpPut("update")]
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

        [HttpGet("getdata")]
        [ProducesResponseType(typeof(ClinicDataDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Get(CancellationToken ct)
        {
            var data = await _repo.GetClinicDataAsync(ct);
            if (data is null) return NotFound();

            // Trả về camelCase + format đẹp cho dễ xem
            var opts = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = true
            };
            return new JsonResult(data, opts);
        }

        [HttpGet("get-user-data")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetDataDentist(CancellationToken ct)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;

            var guestData = await _repo.GetClinicDataAsync(ct);
            var commonData = await _repo.GetUserCommonDataAsync(ct);
            object? result = currentUserRole?.ToLower() switch
            {
                "receptionist" => new { ReceptionistData = await _repo.GetReceptionistData(currentUserId, ct), CommonData = commonData },
                "assistant" => new { AssistantData = await _repo.GetAssistanttData(currentUserId, ct), CommonData = commonData },
                "patient" => new { PatientData = await _repo.GetPatientData(currentUserId, ct), CommonData = commonData },
                "dentist" => new { DentistData = await _repo.GetDentistData(currentUserId, ct), CommonData = commonData },
                "owner" => new { OwnerData = await _repo.GetOwnerData(ct), CommonData = commonData },
                _ => new { GuestData = guestData }
            };

            if (result is null) return NotFound();

            var opts = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = true
            };

            return new JsonResult(result, opts);
        }

    }
}
