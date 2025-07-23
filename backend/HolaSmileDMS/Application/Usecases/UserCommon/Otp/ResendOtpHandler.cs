using Application.Common.Helpers;
using Application.Constants;
using Application.Interfaces;
using HDMS_API.Application.Interfaces;
using HDMS_API.Application.Usecases.UserCommon.Otp;
using MediatR;
using Microsoft.Extensions.Caching.Memory;

namespace Application.Usecases.UserCommon.Otp
{
    internal class ResendOtpHandler : IRequestHandler<ResendOtpCommand, bool>
    {
        private readonly IEmailService _emailService;
        private readonly IMemoryCache _memoryCache;
        public ResendOtpHandler(IEmailService emailService, IMemoryCache memoryCache)
        {
            _emailService = emailService;
            _memoryCache = memoryCache;
        }
        public async Task<bool> Handle(ResendOtpCommand request, CancellationToken cancellationToken)
        {

            //return await _userCommonRepository.ResendOtpAsync(request.email);
            if (_memoryCache.TryGetValue($"otp:{request.email}", out RequestOtpDto cachedOtp))
            {
                if (cachedOtp.SendTime.AddMinutes(1) < DateTime.Now)
                {
                    var OtpCode = GenerateOTPHelper.GenerateOTP();
                    var messasge = $@"
                                  <p>Xin chào,</p>
                                  <p>Bạn đã yêu cầu xác thực bằng mã OTP.</p>
                                  <p><strong>Mã OTP của bạn là:</strong> <b style='font-size: 18px; color: blue;'>{OtpCode}</b></p>
                                  <p>Mã này sẽ hết hạn sau <strong>5 phút</strong>. Vui lòng không chia sẻ mã với bất kỳ ai.</p>
                                  <p>Trân trọng,<br><b>Phòng khám HolaSmile</b></p>";

                    _ = System.Threading.Tasks.Task.Run(async () =>
                    {
                        try
                        {
                            await _emailService.SendEmailAsync(request.email, messasge);
                        }
                        catch (Exception ex)
                        {
                            throw new Exception(MessageConstants.MSG.MSG78);
                        }
                    });
                    var otp = new RequestOtpDto
                    {
                        Email = request.email,
                        Otp = OtpCode,
                        ExpiryTime = DateTime.Now.AddMinutes(1)
                    };
                    _memoryCache.Set($"otp:{request.email}", otp, otp.ExpiryTime - DateTime.Now);
                    return true;
                }
                else
                {
                    throw new Exception("Bạn chỉ có thể gửi lại OTP sau 1 phút.");
                }
            }
            else
            {
                throw new Exception(MessageConstants.MSG.MSG78); // Gửi mã OTP không thành công
            }
        }
    }
}
