using Application.Common.Helpers;
using Application.Constants;
using Application.Interfaces;
using HDMS_API.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using System.Security.Claims;

namespace HDMS_API.Application.Usecases.UserCommon.ChangeEmailOtp
{
    public class ResendChangeEmailOtpHandler : IRequestHandler<ResendChangeEmailOtpCommand, bool>
    {
        private readonly IHttpContextAccessor _http;
        private readonly IMemoryCache _cache;
        private readonly IEmailService _email;

        public ResendChangeEmailOtpHandler(IHttpContextAccessor http, IMemoryCache cache, IEmailService email)
        {
            _http = http; _cache = cache; _email = email;
        }

        public async Task<bool> Handle(ResendChangeEmailOtpCommand request, CancellationToken ct)
        {
            var user = _http.HttpContext?.User ?? throw new UnauthorizedAccessException("Bạn cần đăng nhập.");
            var userId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId <= 0) throw new UnauthorizedAccessException("Bạn cần đăng nhập.");

            if (!_cache.TryGetValue($"change-email-otp:{userId}", out ChangeEmailOtpDto cached))
                throw new Exception("Quy trình đổi email chưa được khởi tạo.");

            // bắt buộc resend đúng vào email đang chờ
            if (!string.Equals(cached.NewEmail, request.NewEmail, StringComparison.OrdinalIgnoreCase))
                throw new Exception("Email không khớp với yêu cầu hiện tại.");

            // 60s giữa 2 lần gửi
            if (cached.SendTime.AddSeconds(60) > DateTime.Now)
                throw new Exception("Bạn chỉ có thể gửi lại OTP sau 60 giây.");

            var otp = GenerateOTPHelper.GenerateOTP();
            var subject = "Xác thực đổi email - HolaSmile";
            var html = $@"<p>Mã OTP của bạn: <b style='font-size:18px'>{otp}</b></p>
                      <p>OTP hết hạn sau <b>5 phút</b>. Không chia sẻ mã này.</p>";

            if (!await _email.SendEmailAsync(cached.NewEmail, html, subject))
                throw new Exception(MessageConstants.MSG.MSG78);

            // reset SendTime và gia hạn 5 phút kể từ lúc resend
            cached.Otp = otp;
            cached.SendTime = DateTime.Now;
            cached.ExpiryTime = DateTime.Now.AddMinutes(5);
            cached.RetryCount += 1;

            _cache.Set($"change-email-otp:{userId}", cached, cached.ExpiryTime - DateTime.Now);
            return true;
        }
    }

}
