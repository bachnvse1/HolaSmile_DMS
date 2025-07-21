using Application.Usecases.UserCommon.RefreshToken;
using Application.Constants;
using Application.Usecases.UserCommon.ViewAllUserChat;
using Application.Usecases.UserCommon.ViewProfile;
using HDMS_API.Application.Usecases.UserCommon.EditProfile;
using HDMS_API.Application.Usecases.UserCommon.Login;
using HDMS_API.Application.Usecases.UserCommon.Otp;
using HDMS_API.Infrastructure.Persistence;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authorization;
using HDMS_API.Application.Usecases.UserCommon.ForgotPassword;
using Application.Usecases.UserCommon.ForgotPasswordBySMS;

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
                    ex.Message
                });
            }
        }


        [Authorize]
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
                    ex.Message
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
                    ex.Message
                });
            }
        }

        [HttpPost("OTP-Request-sms")]
        public async Task<IActionResult> RequestOtpSMS([FromBody] ForgotPasswordBySmsCommand request)
        {
            try
            {
                var result = await _mediator.Send(request);
                return result
                    ? Ok(MessageConstants.MSG.MSG44)
                    : BadRequest(MessageConstants.MSG.MSG58);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    ex.Message
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
                    ex.Message
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
                    ex.Message
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
                    ex.Message
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
            catch (UnauthorizedAccessException ex)
            {
                // Trả về lỗi 401 Unauthorized với message chính xác từ handler
                return Unauthorized(new
                {
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                // Trả về lỗi 400 BadRequest nếu có lỗi hệ thống
                return BadRequest(new
                {
                    message = ex.Message
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
        
        [HttpGet("allUsersChat")]
        [Authorize]
        public async Task<IActionResult> GetAllUsers()
        {
            var result = await _mediator.Send(new ViewAllUsersChatCommand());
            return Ok(result);
        }
    }
}


