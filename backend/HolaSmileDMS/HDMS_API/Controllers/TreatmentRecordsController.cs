using System.Security.Claims;
using Application.Usecases.Patients.ViewTreatmentRecord;
using MediatR;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/treatment-records")]
public class TreatmentRecordsController : ControllerBase
{
    private readonly IMediator _mediator;

    public TreatmentRecordsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Lấy danh sách hồ sơ điều trị của một người dùng cụ thể.
    /// Quyền truy cập đã được kiểm tra bên trong Handler.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetRecords([FromQuery] int userId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _mediator.Send(new ViewTreatmentRecordsCommand(userId), cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                message = "Dữ liệu không tồn tại",
                Inner = ex.InnerException?.Message,
                Stack = ex.StackTrace
            });
        }
    }
}