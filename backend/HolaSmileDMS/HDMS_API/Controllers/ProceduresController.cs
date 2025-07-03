using Application.Constants;
using Application.Usecases.Assistant.Template.ProcedureTemplate.CreateProcedure;
using Application.Usecases.UserCommon.ViewListProcedure;
using MediatR;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers;

[Route("api/procedures")]
[ApiController]
public class ProceduresController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProceduresController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetProcedures()
    {
        var result = await _mediator.Send(new ViewListProcedureCommand());
        return Ok(result);
    }

    [HttpPost("create-procedure")]
    public async Task<IActionResult> CreateProcedure([FromBody] CreateProcedureCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);

            return result ? Ok(MessageConstants.MSG.MSG69) : BadRequest(MessageConstants.MSG.MSG58);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                message = MessageConstants.MSG.MSG26 // "Bạn không có quyền truy cập chức năng này"
            });
        }
        catch (Exception)
        {
            return StatusCode(500, new
            {
                message = MessageConstants.MSG.MSG58 // "Cập nhật dữ liệu thất bại" (hoặc có thể là lỗi hệ thống không xác định)
            });
        }
    }
}