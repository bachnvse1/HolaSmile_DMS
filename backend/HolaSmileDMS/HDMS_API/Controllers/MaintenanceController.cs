using Application.Usecases.Receptionist.ConfigNotifyMaintenance;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MaintenanceController : ControllerBase
    {
        private readonly IMediator _mediator;

        public MaintenanceController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateMaintenance([FromBody] CreateMaintenanceCommand command)
        {
            try
            {
                var result = await _mediator.Send(command);
                if (result)
                    return Ok(new { message = "Tạo bảo trì thành công." });

                return BadRequest(new { message = "Không thể tạo bảo trì." });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("view")]
        public async Task<IActionResult> ViewMaintenances()
        {
            try
            {
                var result = await _mediator.Send(new ViewMaintenanceCommand());

                return Ok(new
                {
                    message = "Lấy danh sách bảo trì thành công.",
                    data = result
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("details/{id}")]
        public async Task<IActionResult> GetMaintenanceDetails(int id)
        {
            try
            {
                var result = await _mediator.Send(new ViewMaintenanceDetailsCommand(id));
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        [HttpPost("create-transaction")]       
        public async Task<IActionResult> CreateTransactionForMaintenance([FromBody] CreateTransactionForMaintenanceCommand command)
        {
            var result = await _mediator.Send(command);
            if (result)
                return Ok(new { success = true, message = "Tạo phiếu chi thành công" });
            else
                return BadRequest(new { success = false, message = "Tạo phiếu chi thất bại" });
        }
    }
}
