using Application.Constants;
using Application.Usecases.Dentist.CreateTreatmentProgress;
using Application.Usecases.Dentist.UpdateTreatmentProgress;
using Application.Usecases.Patients.ViewTreatmentProgress;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers;

[ApiController]
[Route("api/treatment-progress")]
public class TreatmentProgressController : ControllerBase
{
    private readonly IMediator _mediator;

    public TreatmentProgressController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // GET: api/TreatmentProgress/{treatmentRecordId}
    [HttpGet("{treatmentRecordId}")]
    public async Task<IActionResult> GetTreatmentProgressByRecordId(int treatmentRecordId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _mediator.Send(new ViewTreatmentProgressCommand(treatmentRecordId), cancellationToken);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                message = MessageConstants.MSG.MSG26
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                ex.Message,
                Inner = ex.InnerException?.Message,
                Stack = ex.StackTrace
            });
        }
    }
    
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTreatmentProgressDto dto)
    {
        var result = await _mediator.Send(new CreateTreatmentProgressCommand { ProgressDto = dto });
        return Ok(new { message = result });
    }
    
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTreatmentProgressCommand command)
    {
        if (id != command.TreatmentProgressID)
            return BadRequest(MessageConstants.MSG.MSG16); // Không có dữ liệu phù hợp

        var result = await _mediator.Send(command);
        if (!result)
            return StatusCode(500, MessageConstants.MSG.MSG58); // Cập nhật dữ liệu thất bại

        return Ok(new { message = MessageConstants.MSG.MSG38 });
    }
}