using Application.Constants;
using Application.Interfaces;
using HDMS_API.Application.Interfaces;
using MediatR;
using Microsoft.Extensions.Caching.Memory;
using static System.Net.WebRequestMethods;

namespace HDMS_API.Application.Usecases.UserCommon.Otp
{
    public class VerifyOtpHandler : IRequestHandler<VerifyOtpCommand, string>
    {
        private readonly IEmailService _emailService;
        private readonly IMemoryCache _memoryCache;
        public VerifyOtpHandler(IEmailService emailService, IMemoryCache memoryCache)
        {
            _emailService = emailService;
            _memoryCache = memoryCache;
        }
        public async Task<string> Handle(VerifyOtpCommand request, CancellationToken cancellationToken)
        {
            if (_memoryCache.TryGetValue($"otp:{request.Email}", out RequestOtpDto cachedOtp))
            {
                if (cachedOtp.Otp == request.Otp && cachedOtp.ExpiryTime > DateTime.Now)
                {
                    _memoryCache.Remove($"otp:{request.Email}");
                    var resetPasswordToken = Guid.NewGuid().ToString();
                    _memoryCache.Set($"resetPasswordToken:{resetPasswordToken}", request.Email, TimeSpan.FromMinutes(15)); // Token hợp lệ trong 15 phút
                    return resetPasswordToken;
                }
                else
                {
                    throw new Exception(MessageConstants.MSG.MSG04); // Mã OTP không đúng
                }
            }
            else
            {
                throw new Exception(MessageConstants.MSG.MSG79); // thời gian thực hiện hết hạn
            }
        }
    }

}
