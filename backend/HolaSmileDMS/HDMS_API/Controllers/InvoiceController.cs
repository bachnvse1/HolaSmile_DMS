using Application.Constants;
using Application.Usecases.Patients.ViewInvoices;
using Application.Usecases.Receptionist.CreateInvoice;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers;

[ApiController]
[Route("api/invoice")]
[Authorize]
public class InvoiceController : ControllerBase
{
    private readonly IMediator _mediator;

    public InvoiceController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("view-list")]
    public async Task<IActionResult> ViewList([FromQuery] ViewListInvoiceCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403, new { message = MessageConstants.MSG.MSG26 });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("view-detail/{id}")]
    public async Task<IActionResult> ViewDetail(int id)
    {
        try
        {
            var result = await _mediator.Send(new ViewDetailInvoiceCommand(id));
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403, new { message = MessageConstants.MSG.MSG26 });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
    [HttpPost("create")]
    public async Task<IActionResult> CreateInvoice([FromBody] CreateInvoiceCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);
            return Ok(new { message = result });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = MessageConstants.MSG.MSG26 });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            // Trả lỗi 500 cho những exception không xác định
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }
}