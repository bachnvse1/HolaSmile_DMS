using Application.Usecases.Assistants.CreateInstructionTemplete;
using Application.Usecases.Assistants.DeleteInstructionTemplate;
using Application.Usecases.Assistants.EditInstructionTemplate;
using Application.Usecases.Assistants.ViewInstructionTemplateList;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Application.Constants;

namespace HDMS_API.Controllers;

[ApiController]
[Route("api/instruction-templates")]
[Authorize]
public class InstructionTemplateController : ControllerBase
{
    private readonly IMediator _mediator;

    public InstructionTemplateController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInstructionTemplateCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);
            return Ok(new { message = result });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403,MessageConstants.MSG.MSG26); // Không có quyền
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message }); // Thiếu input
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi hệ thống." });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var result = await _mediator.Send(new ViewInstructionTemplateListQuery());
            return Ok(result);
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Không thể lấy danh sách mẫu chỉ dẫn." });
        }
    }

    [HttpPut]
    public async Task<IActionResult> Edit([FromBody] EditInstructionTemplateCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);
            return Ok(new { message = result });
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403,MessageConstants.MSG.MSG26);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message }); // Trả về message từ handler: MSG115 hoặc lỗi input
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var result = await _mediator.Send(new DeactiveInstructionTemplateCommand { Instruc_TemplateID = id });
            return Ok(new { message = result });
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403,MessageConstants.MSG.MSG26);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message }); // MSG115 nếu không tìm thấy
        }
    }
}