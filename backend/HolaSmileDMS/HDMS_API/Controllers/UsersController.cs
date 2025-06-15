using System.Threading.Tasks;
using HDMS_API.Application.Usecases.Auth.ForgotPassword;
using HDMS_API.Application.Usecases.UserCommon.Otp;
using HDMS_API.Infrastructure.Persistence;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
        [HttpPost("OTP/Request")]
        public async Task<IActionResult> RequestOtp([FromBody] RequestOtpCommand request)
        {
            try
            {
                var result = await _mediator.Send(request);
                return result ? Ok(new { message = "Xác minh OTP thành công" }) : BadRequest("Mã OTP không đúng hoặc đã hết hạn.");
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
    }
}
