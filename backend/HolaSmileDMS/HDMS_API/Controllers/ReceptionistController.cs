using Application.Constants;
using Application.Usecases.Receptionist.EditPatientInformation;
using Application.Usecases.Dentist.ViewListReceptionistName;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;
using MediatR;
using Microsoft.AspNetCore.Authorization;
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

        [Authorize]
        [HttpPost("patients")]
        public async Task<IActionResult> CreatePatient([FromBody] CreatePatientCommand request)
        {
            if (request == null)
            {
                return BadRequest("dữ liệu đầu vào không hợp lệ.");
            }
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

        [Authorize]
        [HttpPut("patients")]
        public async Task<IActionResult> EditPatientInformationByReceptionist([FromBody] EditPatientInformationCommand command)
        {
            try
            {
                var result = await _mediator.Send(command);
                return Ok(new { message = MessageConstants.MSG.MSG09, data = result });
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
        /// <summary>
        /// Get all receptionists (name + id)
        /// </summary>
        [HttpGet("listPatientsName")]
        public async Task<IActionResult> listPatientsName(CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new ViewReceptionistListCommand(), cancellationToken);
            return Ok(result);
        }
    }
}
