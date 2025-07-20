using Application.Interfaces;
using Application.Services;
using HDMS_API.Application.Usecases.UserCommon.Otp;
using MediatR;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.VisualStudio.Web.CodeGenerators.Mvc.Templates.BlazorIdentity.Pages.Manage;

namespace Application.Usecases.UserCommon.Otp
{
    public class RequestOTPBySmsHandler : IRequestHandler<RequestOTPBySmsCommand, bool>
    {
        private readonly IUserCommonRepository _userRepo;
        private readonly IEsmsService _smsService;
        private readonly IMemoryCache _memoryCache;

        public RequestOTPBySmsHandler(IUserCommonRepository userRepo, IEsmsService smsService,IMemoryCache memoryCache)
        {
            _userRepo = userRepo;
            _smsService = smsService;
            _memoryCache = memoryCache;
        }

        public async Task<bool> Handle(RequestOTPBySmsCommand request, CancellationToken cancellationToken)
        {
            var user = await _userRepo.GetUserByPhoneAsync(request.PhoneNumber);
            if (user == null)
                throw new Exception("Số điện thoại không tồn tại trong hệ thống.");

            var otpCode = GenerateOtp();

            var sent = await _smsService.SendOTPAsync(request.PhoneNumber, otpCode);
            if (sent == false)
            {
                throw new Exception("Gửi OTP không thành công. Vui lòng thử lại sau.");
            }

            // Lưu OTP vào bộ nhớ cache với thời gian hết hạn là 5 phút
            var otp = new RequestOtpDto
            {
                Email = request.PhoneNumber,
                Otp = otpCode,
                ExpiryTime = DateTime.Now.AddMinutes(2)
            };
            _memoryCache.Set($"otp:{request.PhoneNumber}", otp, otp.ExpiryTime - DateTime.Now);

            return true; // "Cập nhật mật khẩu thành công"
        }

        private string GenerateOtp()
        {
            return new Random().Next(100000, 999999).ToString();
        }
    }
}
