using Application.Constants;
using Application.Interfaces;
using Application.Services;
using MediatR;
using Microsoft.Extensions.Caching.Memory;

namespace Application.Usecases.UserCommon.ForgotPasswordBySMS
{
    public class ForgotPasswordBySmsHandler : IRequestHandler<ForgotPasswordBySmsCommand, bool>
    {
        private readonly IUserCommonRepository _userRepo;
        private readonly IEsmsService _smsService;
        private readonly IMemoryCache _memoryCache;

        public ForgotPasswordBySmsHandler(IUserCommonRepository userRepo, IEsmsService smsService,IMemoryCache memoryCache)
        {
            _userRepo = userRepo;
            _smsService = smsService;
            _memoryCache = memoryCache;
        }

        public async Task<bool> Handle(ForgotPasswordBySmsCommand request, CancellationToken cancellationToken)
        {
            var user = await _userRepo.GetUserByPhoneAsync(request.PhoneNumber);
            if (user == null)
                throw new Exception(MessageConstants.MSG.MSG16);

            var newPassword = GeneratePassword();

            _ = System.Threading.Tasks.Task.Run(async () =>
            {
                try
                {
                    var sent = await _smsService.SendPasswordAsync(request.PhoneNumber, newPassword);
                }
                catch (Exception ex)
                {
                    throw new Exception("Gửi mật khẩu mới không thành công. Vui lòng thử lại sau.");
                }
            });

            user.Password = BCrypt.Net.BCrypt.HashPassword(newPassword);
            user.UpdatedAt = DateTime.Now;
            user.UpdatedBy = user.UserID;
            var updated = await _userRepo.EditProfileAsync(user, cancellationToken);

            return updated;
        }

        private string GeneratePassword()
        {
            const string chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
            var random = new Random();
            return new string(Enumerable.Range(0, 8).Select(_ => chars[random.Next(chars.Length)]).ToArray());
        }
    }
}
