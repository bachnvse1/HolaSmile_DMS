using Application.Constants;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using System.Security.Claims;

namespace HDMS_API.Application.Usecases.UserCommon.ChangeEmailOtp
{
    public class VerifyChangeEmailOtpHandler : IRequestHandler<VerifyChangeEmailOtpCommand, string>
    {
        private readonly IHttpContextAccessor _http;
        private readonly IMemoryCache _cache;

        public VerifyChangeEmailOtpHandler(IHttpContextAccessor http, IMemoryCache cache)
        {
            _http = http; _cache = cache;
        }

        public async Task<string> Handle(VerifyChangeEmailOtpCommand request, CancellationToken ct)
        {
            var user = _http.HttpContext?.User ?? throw new UnauthorizedAccessException("Bạn cần đăng nhập.");
            var userId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId <= 0) throw new UnauthorizedAccessException("Bạn cần đăng nhập.");

            if (!_cache.TryGetValue($"change-email-otp:{userId}", out ChangeEmailOtpDto cached))
                throw new Exception(MessageConstants.MSG.MSG79); // Hết hạn quy trình

            if (!string.Equals(cached.NewEmail, request.NewEmail, StringComparison.OrdinalIgnoreCase))
                throw new Exception("Email xác thực không khớp với yêu cầu ban đầu.");

            if (cached.ExpiryTime <= DateTime.Now)
                throw new Exception(MessageConstants.MSG.MSG79);

            if (!string.Equals(cached.Otp, request.Otp, StringComparison.OrdinalIgnoreCase))
                throw new Exception(MessageConstants.MSG.MSG04); // Mã OTP không đúng

            var changeEmailToken = Guid.NewGuid().ToString();
            _cache.Remove($"change-email-otp:{userId}");
            _cache.Set($"change-email-token:{changeEmailToken}",
                new { UserId = userId, NewEmail = cached.NewEmail },
                TimeSpan.FromMinutes(15));

            return changeEmailToken;
        }
    }

}
