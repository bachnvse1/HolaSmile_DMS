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
        var result = await _mediator.Send(new ViewOrthodonticTreatmentPlanCommand(planId, patientId));
        return Ok(result);
    }
}