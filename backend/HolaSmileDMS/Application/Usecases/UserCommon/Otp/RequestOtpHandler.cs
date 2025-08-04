using Application.Common.Helpers;
using Application.Constants;
using Application.Interfaces;
using HDMS_API.Application.Common.Helpers;
using HDMS_API.Application.Interfaces;
using MediatR;
using Microsoft.Extensions.Caching.Memory;

namespace HDMS_API.Application.Usecases.UserCommon.Otp
{
    public class RequestOtpHandler : IRequestHandler<RequestOtpCommand, bool>
    {
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IEmailService _emailService;
        private readonly IMemoryCache _memoryCache;
        public RequestOtpHandler(IUserCommonRepository userCommonRepository,IEmailService emailService, IMemoryCache memoryCache)
        {
            _userCommonRepository = userCommonRepository;
            _emailService = emailService;
            _memoryCache = memoryCache;
        }
        public async Task<bool> Handle(RequestOtpCommand request, CancellationToken cancellationToken)
        {
            if (FormatHelper.IsValidEmail(request.Email) == false)
            {
                throw new Exception(MessageConstants.MSG.MSG08);
            }

            var existUser = await _userCommonRepository.GetUserByEmailAsync(request.Email);
            if (existUser == null)
            {
                return true;
            }

            var OtpCode = GenerateOTPHelper.GenerateOTP();

            var subject = "Xác thực OTP từ Phòng khám HolaSmile";

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
                    await _emailService.SendEmailAsync(request.Email, messasge, subject);
                }
                catch (Exception ex)
                {
                    throw new Exception(MessageConstants.MSG.MSG78);
                }
            });
            var otp = new RequestOtpDto
            {
                Email = request.Email,
                Otp = OtpCode,
                ExpiryTime = DateTime.Now.AddMinutes(1)
            };
            _memoryCache.Set($"otp:{request.Email}", otp, otp.ExpiryTime - DateTime.Now);
            return true;
        }
    }
}
