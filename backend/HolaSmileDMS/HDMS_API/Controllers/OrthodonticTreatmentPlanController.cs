using Application.Usecases.Dentists.CreateOrthodonticTreatmentPlan;
using Application.Usecases.Dentists.UpdateOrthodonticTreatmentPlan;
using Application.Usecases.Dentists.DeactiveOrthodonticTreatmentPlan;
using Application.Usecases.Patients.ViewAllOrthodonticTreatmentPlan;
using Application.Usecases.Patients.ViewOrthodonticTreatmentPlan;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers;

[ApiController]
[Route("api/orthodontic-treatment-plan")]
[Authorize]
public class OrthodonticTreatmentPlanController : ControllerBase
{
    private readonly IMediator _mediator;

    public OrthodonticTreatmentPlanController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Lấy chi tiết kế hoạch điều trị chỉnh nha theo PlanId và PatientId
    /// </summary>
    /// <param name="planId">Mã kế hoạch điều trị</param>
    /// <param name="patientId">Mã bệnh nhân (bắt buộc với bác sĩ/lễ tân/trợ lý)</param>
    [HttpGet("{planId}")]
    public async Task<IActionResult> GetPlan([FromRoute] int planId, [FromQuery] int? patientId)
    {
        try
        {
            var result = await _mediator.Send(new ViewOrthodonticTreatmentPlanCommand(planId, patientId));
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Tạo kế hoạch điều trị chỉnh nha mới
    /// </summary>
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreatePlan([FromBody] CreateOrthodonticTreatmentPlanCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);
            return Ok(new { message = result });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
    
    /// <summary>
    /// Cập nhật kế hoạch điều trị chỉnh nha (chỉ dành cho Dentist)
    /// </summary>
    [HttpPut("update")]
    [Authorize]
    public async Task<IActionResult> UpdateOrthodonticTreatmentPlan([FromBody] EditOrthodonticTreatmentPlanDto dto)
    {
        try
        {
            var result = await _mediator.Send(new EditOrthodonticTreatmentPlanCommand(dto));
            return Ok(new { Message = result });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { Message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            // Trả lỗi hệ thống hoặc lỗi chưa xác định
            return BadRequest(new { Message = ex.Message });
        }
    }
    
    /// <summary>
    /// Hủy kích hoạt kế hoạch điều trị chỉnh nha (chỉ dành cho Dentist)
    /// </summary>
    [HttpPut("deactive/{planId}")]
    [Authorize]
    public async Task<IActionResult> Deactive(int planId)
    {
        try
        {
            var result = await _mediator.Send(new DeactiveOrthodonticTreatmentPlanCommand(planId));
            return Ok(new { Message = result });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { Message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
    
    /// <summary>
    /// Xem kế hoạch điều trị chỉnh nha theo bệnh nhân.
    /// - Patient: xem của chính mình (không cần truyền PatientId)
    /// - Dentist/Assistant/...: cần truyền PatientId
    /// </summary>
    [HttpGet("view-all")]
    [Authorize]
    public async Task<IActionResult> ViewAll([FromQuery] int patientId)
    {
        try
        {
            var result = await _mediator.Send(new ViewAllOrthodonticTreatmentPlanCommand
            {
                PatientId = patientId
            });

            return Ok(new
            {
                Data = result
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { Message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
}