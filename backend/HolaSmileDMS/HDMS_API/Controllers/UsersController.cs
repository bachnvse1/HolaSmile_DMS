using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Application.Usecases.UserCommon.RefreshToken;
using Application.Usecases.UserCommon.ViewListPatient;
using Application.Usecases.UserCommon.ViewProfile;
using HDMS_API.Application.Usecases.Auth.ForgotPassword;
using HDMS_API.Application.Usecases.UserCommon.EditProfile;
using HDMS_API.Application.Usecases.UserCommon.Login;
using HDMS_API.Application.Usecases.UserCommon.Otp;
using HDMS_API.Infrastructure.Persistence;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NuGet.Protocol.Plugins;

namespace HDMS_API.Controllers
{
    [Route("api/user")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMediator _mediator;
        public UsersController(ApplicationDbContext context, IMediator mediator)
        {
            _context = context;
            _mediator = mediator;
        }

        [HttpGet]
        public IActionResult GetAllUser()
        {
            var user = _context.Users.ToList();
            return Ok(user);
        }


        [HttpGet("profile/{userId}")]
        public async Task<IActionResult> ViewProfile([FromRoute] int userId, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _mediator.Send(new ViewProfileCommand { UserId = userId }, cancellationToken);

                if (result == null)
                {
                    return NotFound(new { message = "Không tìm thấy người dùng." });
                }

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

        [HttpPut("profile")]
        public async Task<IActionResult> EditProfile([FromBody] EditProfileCommand command, CancellationToken cancellationToken)
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
                return result ? Ok(new { message = "Mã OTP đã được gửi đến email của bạn" }) : BadRequest("Gửi OTP thất bại.");
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
                return result ? Ok(new { message = "Mã OTP đã được gửi lại vào email của bạn" }) : BadRequest("Gửi lại OTP thất bại.");
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
                return Unauthorized(new { message = "Sai tên đăng nhập hoặc mật khẩu || Tài khoản đã bị ban" });
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

        [HttpGet("ViewListPatients")]
        public async Task<IActionResult> ViewPatientList()
        {
            try
            {
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userIdStr, out var userId))
                    return Unauthorized("Bạn không có quyền truy cập danh sách bệnh nhân.");

                var command = new ViewListPatientCommand { UserId = userId };
                var result = await _mediator.Send(command);

                if (result == null || !result.Any())
                    return Ok(new { message = "Không có dữ liệu phù hợp" });

                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { ex.Message, ex.StackTrace });
            }
        }
    }
}

