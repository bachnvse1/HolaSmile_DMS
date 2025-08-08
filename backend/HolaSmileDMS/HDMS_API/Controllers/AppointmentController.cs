﻿using Application.Usecases.UserCommon.ViewAppointment;
using Application.Usecases.Patients.CancelAppointment;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Application.Usecases.Receptionist.CreateFUAppointment;
using Application.Usecases.Receptionist.EditAppointment;
using Application.Constants;
using Application.Usecases.Receptionist.ChangeAppointmentStatus;
using Application.Usecases.Guests.BookAppointment;

namespace HDMS_API.Controllers
{
    [Route("api/appointment")]
    [ApiController]
    public class AppointmentController : ControllerBase
    {
        private readonly IMediator _mediator;
        public AppointmentController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [Authorize]
        [HttpGet]
        [Route("listAppointment")]
        public async Task<IActionResult> GetAppointment(CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(new ViewAppointmentCommand(), cancellationToken);
                return Ok(result);
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
        [HttpGet("{appointmentId}")]
        public async Task<IActionResult> ViewDetailAppointment([FromRoute] int appointmentId, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(new ViewDetailAppointmentCommand(appointmentId), cancellationToken);
                return Ok(result);
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
        [HttpPost("FUappointment")]
        public async Task<IActionResult> CreateFUAppointment([FromBody] CreateFUAppointmentCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(request, cancellationToken);
                return Ok(result);
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

        [HttpPost("create-captcha")]
        public async Task<IActionResult> CreateCaptcha( CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(new CreateCaptchaCommand(), cancellationToken);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    ex.Message,
                    Stack = ex.StackTrace
                });
            }
        }

        [Authorize]
        [HttpPut]
        [Route("cancelAppointment")]
        public async Task<IActionResult> ViewDetailPatientAppointment([FromBody] CancelAppointmentCommand command, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(command, cancellationToken);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    ex.Message,
                });
            }
        }

        [Authorize]
        [HttpPut("updateAppointment")]
        public async Task<IActionResult> UpdateAppointment([FromBody] EditAppointmentCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(request, cancellationToken);
                return result ? Ok(MessageConstants.MSG.MSG61) : Conflict(MessageConstants.MSG.MSG58);
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
        [HttpPut("changeStatus")]
        public async Task<IActionResult> ChangeAppointmentStatus([FromBody] ChangeAppointmentStatusCommand command, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(command, cancellationToken);
                return result ? Ok(MessageConstants.MSG.MSG61) : Conflict(MessageConstants.MSG.MSG58);
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
