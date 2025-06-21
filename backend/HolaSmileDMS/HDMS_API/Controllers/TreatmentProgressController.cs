using Application.Usecases.Patients.ViewTreatmentProgress;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TreatmentProgressController : ControllerBase
{
    private readonly IMediator _mediator;

    public TreatmentProgressController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // GET: api/TreatmentProgress/{treatmentRecordId}
    [HttpGet("{treatmentRecordId}")]
    [Authorize]
    public async Task<IActionResult> GetTreatmentProgressByRecordId(int treatmentRecordId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _mediator.Send(new ViewTreatmentProgressCommand(treatmentRecordId), cancellationToken);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
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
}