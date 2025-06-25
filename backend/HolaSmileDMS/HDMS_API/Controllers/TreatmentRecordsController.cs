using Application.Constants;
using Application.Usecases.Dentist.CreateTreatmentRecord;
using Application.Usecases.Dentist.UpdateTreatmentRecord;
using Application.Usecases.Patients.ViewTreatmentRecord;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = MessageConstants.MSG.MSG16 }); // Không có dữ liệu phù hợp
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid(MessageConstants.MSG.MSG26); // Bạn không có quyền truy cập chức năng này
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                message = MessageConstants.MSG.MSG58, // Cập nhật dữ liệu thất bại (có thể sửa thành "Lỗi khi truy vấn dữ liệu" nếu cần thêm mã riêng)
                Inner = ex.InnerException?.Message,
                Stack = ex.StackTrace
            });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRecord(int id, CancellationToken cancellationToken)
    {
        try
        {
            var command = new DeleteTreatmentRecordCommand
            {
                TreatmentRecordId = id
            };

            var result = await _mediator.Send(command, cancellationToken);

            return Ok(new
            {
                success = result,
                message = MessageConstants.MSG.MSG57 // "Xoá dữ liệu thành công"
            });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new
            {
                message = MessageConstants.MSG.MSG27 // "Không tìm thấy hồ sơ bệnh nhân"
            });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"
        }
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRecord(int id, [FromBody] UpdateTreatmentRecordCommand command, CancellationToken cancellationToken)
    {
        command.TreatmentRecordId = id;
        try
        {
            var result = await _mediator.Send(command, cancellationToken);
            return Ok(new { success = result, message = MessageConstants.MSG.MSG61 });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = MessageConstants.MSG.MSG27 });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid(MessageConstants.MSG.MSG26);
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                message = MessageConstants.MSG.MSG58,
            });
        }
    }
    
    [HttpPost]
    public async Task<IActionResult> CreateTreatmentRecord([FromBody] CreateTreatmentRecordCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(new { success = true, message = result });
    }


}
