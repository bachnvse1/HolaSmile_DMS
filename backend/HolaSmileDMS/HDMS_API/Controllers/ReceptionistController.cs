using System.Security.Claims;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers
{
    [Route("api/Receptionist")]
    [ApiController]
    public class ReceptionistController : ControllerBase
    {
        private readonly IMediator _mediator;
        public ReceptionistController(IMediator mediator)
        {
            _mediator = mediator;
        }

        //[Authorize(Roles = "receptionist")]    //config role ở jwt
        [HttpPost("patients")]
        public async Task<IActionResult> CreatePatient([FromBody] CreatePatientCommand request)
        {
            if (request == null)
            {
                return BadRequest("dữ liệu đầu vào không hợp lệ.");
            }
            // thêm session để lấy createdby
            //var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            try
            {
                var result = await _mediator.Send(request);
                return Ok(new { Message = "Tạo hồ sơ bệnh ánh thành công.", PatientId = result });
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
}
