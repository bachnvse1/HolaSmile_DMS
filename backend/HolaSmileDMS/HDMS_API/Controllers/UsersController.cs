using Application.Usecases.UserCommon.RefreshToken;
using Application.Constants;
using Application.Usecases.UserCommon.ViewProfile;
using HDMS_API.Application.Usecases.Auth.ForgotPassword;
using HDMS_API.Application.Usecases.UserCommon.EditProfile;
using HDMS_API.Application.Usecases.UserCommon.Login;
using HDMS_API.Application.Usecases.UserCommon.Otp;
using HDMS_API.Infrastructure.Persistence;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authorization;

namespace HDMS_API.Controllers
{
    [Route("api/user")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly IMediator _mediator;

        public UsersController(ApplicationDbContext context, IMediator mediator)
        {
            _mediator = mediator;
        }

        [Authorize]
        [HttpGet("profile")]
        public async Task<IActionResult> ViewProfile(CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(new ViewProfileCommand(), cancellationToken);
                return result != null
                    ? Ok(result)
                    : NotFound(new { message = "Không tìm thấy hồ sơ người dùng." });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
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



        [HttpPut("profile")]
        public async Task<IActionResult> EditProfile([FromBody] EditProfileCommand command,
            CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(command, cancellationToken);
                return result
                    ? Ok(new { message = "Cập nhật hồ sơ thành công." })
                    : BadRequest(new { message = "Cập nhật hồ sơ thất bại." });
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

        [HttpPost("OTP/Request")]
        public async Task<IActionResult> RequestOtp([FromBody] RequestOtpCommand request)
        {
            try
            {
                var result = await _mediator.Send(request);
                return result
                    ? Ok(new { message = "Mã OTP đã được gửi đến email của bạn" })
                    : BadRequest("Gửi OTP thất bại.");
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

        [HttpPost("OTP/Resend")]
        public async Task<IActionResult> ResendtOtp([FromBody] ResendOtpCommand request)
        {
            try
            {
                var result = await _mediator.Send(request);
                return result
                    ? Ok(new { message = "Mã OTP đã được gửi lại vào email của bạn" })
                    : BadRequest("Gửi lại OTP thất bại.");
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

        [HttpPost("OTP/Verify")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpCommand request)
        {
            try
            {
                var result = await _mediator.Send(request);
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

        [HttpPost("ResetPassword")]
        public async Task<IActionResult> ResetPassword([FromBody] ForgotPasswordCommand request)
        {
            try
            {
                var result = await _mediator.Send(request);
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

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginCommand command)
        {
            try
            {
                var result = await _mediator.Send(command);
                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new
                {
                    message = $"{MessageConstants.MSG.MSG01} || {MessageConstants.MSG.MSG72}"
                });
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

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenCommand command)
        {
            try
            {
                var result = await _mediator.Send(command);
                return Ok(result);
            }
            catch (SecurityTokenException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }
    }
}


