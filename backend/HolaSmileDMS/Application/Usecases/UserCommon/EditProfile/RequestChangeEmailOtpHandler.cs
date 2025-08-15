using Application.Common.Helpers;
using Application.Constants;
using Application.Interfaces;
using HDMS_API.Application.Common.Helpers;
using HDMS_API.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using System.Security.Claims;

namespace HDMS_API.Application.Usecases.UserCommon.ChangeEmailOtp
{
    public class RequestChangeEmailOtpHandler : IRequestHandler<RequestChangeEmailOtpCommand, bool>
    {
        private readonly IHttpContextAccessor _http;
        private readonly IUserCommonRepository _userRepo;
        private readonly IEmailService _email;
        private readonly IMemoryCache _cache;

        public RequestChangeEmailOtpHandler(
            IHttpContextAccessor http,
            IUserCommonRepository userRepo,
            IEmailService email,
            IMemoryCache cache)
        {
            _http = http; _userRepo = userRepo; _email = email; _cache = cache;
        }

        public async Task<bool> Handle(RequestChangeEmailOtpCommand request, CancellationToken ct)
        {
            var user = _http.HttpContext?.User ?? throw new UnauthorizedAccessException("Bạn cần đăng nhập.");
            var userId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId <= 0) throw new UnauthorizedAccessException("Bạn cần đăng nhập.");

            if (!FormatHelper.IsValidEmail(request.NewEmail))
                throw new Exception(MessageConstants.MSG.MSG08);

            var me = await _userRepo.GetByIdAsync(userId, ct) ?? throw new Exception(MessageConstants.MSG.MSG16);
            if (string.Equals(me.Email, request.NewEmail, StringComparison.OrdinalIgnoreCase))
                throw new Exception("Email mới trùng với email hiện tại.");

            if (await _userRepo.GetUserByEmailAsync(request.NewEmail) != null)
                throw new Exception("Email này đã được sử dụng.");

            // rate limit 60s giữa 2 lần gửi
            if (_cache.TryGetValue($"change-email-otp:{userId}", out ChangeEmailOtpDto prev)
                && prev.SendTime.AddSeconds(60) > DateTime.Now)
                throw new Exception("Bạn chỉ có thể gửi lại OTP sau 60 giây.");

            var otp = GenerateOTPHelper.GenerateOTP();
            var subject = "Xác thực đổi email - HolaSmile";
            var html = $@"<p>Mã OTP của bạn: <b style='font-size:18px'>{otp}</b></p>
                      <p>OTP hết hạn sau <b>5 phút</b>. Không chia sẻ mã này.</p>";

            if (!await _email.SendEmailAsync(request.NewEmail, html, subject))
                throw new Exception(MessageConstants.MSG.MSG78);

            var dto = new ChangeEmailOtpDto
            {
                UserId = userId,
                NewEmail = request.NewEmail,
                Otp = otp,
                SendTime = DateTime.Now,
                ExpiryTime = DateTime.Now.AddMinutes(5),
                RetryCount = (prev?.RetryCount ?? 0) + 1
            };

            _cache.Set($"change-email-otp:{userId}", dto, dto.ExpiryTime - DateTime.Now);
            return true;
        }
    }

}
