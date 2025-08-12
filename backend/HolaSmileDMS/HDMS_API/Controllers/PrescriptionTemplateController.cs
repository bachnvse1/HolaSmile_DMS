﻿using Application.Constants;
using Application.Usecases.Assistant.ViewPrescriptionTemplate;
using Application.Usecases.Assistants.CreatePrescriptionTemplate;
using Application.Usecases.Assistants.DeactivePrescriptionTemplate;
using Application.Usecases.Assistants.UpdatePrescriptionTemplate;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HDMS_API.Controllers
{
    [ApiController]
    [Route("api/prescription-templates")]
    public class PrescriptionTemplateController : ControllerBase
    {
        private readonly IMediator _mediator;

        public PrescriptionTemplateController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAllPrescriptionTemplates()
        {
            try
            {
                var result = await _mediator.Send(new ViewPrescriptionTemplateCommand());
                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    message = MessageConstants.MSG.MSG26
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = MessageConstants.MSG.MSG58 });
            }
        }

        [HttpPut]
        [Authorize]
        public async Task<IActionResult> UpdatePrescriptionTemplate([FromBody] UpdatePrescriptionTemplateCommand command)
        {
            try
            {
                var result = await _mediator.Send(command);
                return Ok(new { message = result });
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = MessageConstants.MSG.MSG26 });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = MessageConstants.MSG.MSG15 });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = MessageConstants.MSG.MSG58 });
            }
        }


        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreatePrescriptionTemplate([FromBody] CreatePrescriptionTemplateCommand command)
        {
            try
            {
                var result = await _mediator.Send(command);
                return Ok(new { message = result });
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = MessageConstants.MSG.MSG26 });
            }
            catch (InvalidOperationException)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "Mẫu đơn thuốc với tên này đã tồn tại" });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = MessageConstants.MSG.MSG58 });
            }
        }

        [HttpPut("deactivate/{id}")]
        [Authorize]
        public async Task<IActionResult> DeactivatePrescriptionTemplate(int id)
        {
            try
            {
                var command = new DeactivePrescriptionTemplateCommand { PreTemplateID = id };
                var result = await _mediator.Send(command);
                return Ok(new { message = result });
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = MessageConstants.MSG.MSG26 });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = MessageConstants.MSG.MSG110 });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = MessageConstants.MSG.MSG58 });
            }
        }


    }
}
