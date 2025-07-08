using Application.Constants;
using Application.Usecases.Assistant.ProcedureTemplate.CreateProcedure;
using Application.Usecases.Assistant.ProcedureTemplate.UpdateProcedure;
using Application.Usecases.Assistant.ProcedureTemplate.ActiveAndDeactiveProcedure;
using Application.Usecases.UserCommon.ViewProcedures;
using MediatR;
using Microsoft.AspNetCore.Authorization;
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

    [Authorize]
    [HttpGet("list-procedure")]
    public async Task<IActionResult> GetAllProcedures()
    {
        try
        {
            var result = await _mediator.Send(new ViewListProcedureCommand());
            return Ok(result);
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
            return StatusCode(500, new
            {
                status = false,
                message = ex.Message
            });
        }
    }

    [Authorize]
    [HttpGet("detail-procedure/{procedureId:int}")]
    public async Task<IActionResult> GetProcedureById(int procedureId)
    {
        try
        {
            var result = await _mediator.Send(new ViewDetailProcedureCommand { proceduredId = procedureId });
            return Ok(result);
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
            return StatusCode(500, new
            {
                status = false,
                message = ex.Message
            });
        }
    }

    [Authorize]
    [HttpPost("create-procedure")]
    public async Task<IActionResult> CreateProcedure([FromBody] CreateProcedureCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);

            return result ? Ok(MessageConstants.MSG.MSG69) : BadRequest(MessageConstants.MSG.MSG58);
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
            return StatusCode(500, new
            {
                status = false,
                message = ex.Message
            });
        }
    }

    [Authorize]
    [HttpPut("update-procedure")]
    public async Task<IActionResult> UpdateProcedureAsync([FromBody] UpdateProcedureCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);

            return result ? Ok(MessageConstants.MSG.MSG71) : BadRequest(MessageConstants.MSG.MSG58);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                Message = false,
                Error = ex.Message // "Bạn không có quyền truy cập chức năng này"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                Message = false,
                inner = ex.InnerException,
                Error = ex.Message // "Cập nhật dữ liệu thất bại" (hoặc có thể là lỗi hệ thống không xác định)
            });
        }
    }

    [Authorize]
    [HttpPut("active-deactive-procedure/{procedureId:int}")]
    public async Task<IActionResult> ActiveAndDeactiveProcedure(int procedureId)
    {
        try
        {
            var result = await _mediator.Send(new ActiveAndDeactiveProcedureCommand { ProcedureId = procedureId });
            return result ? Ok(MessageConstants.MSG.MSG71) : BadRequest(MessageConstants.MSG.MSG58);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                Message = false,
                Error = ex.Message // "Bạn không có quyền truy cập chức năng này"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                Message = false,
                Error = ex.Message // "Cập nhật dữ liệu thất bại" (hoặc có thể là lỗi hệ thống không xác định)
            });
        }
    }
}