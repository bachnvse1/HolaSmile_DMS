using Application.Constants;
using Application.Interfaces;
using HDMS_API.Application.Common.Helpers;
using MediatR;
using Microsoft.Extensions.Caching.Memory;

namespace HDMS_API.Application.Usecases.UserCommon.ForgotPassword
{
    public class ForgotPasswordHandler : IRequestHandler<ForgotPasswordCommand, string>
    {
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IMemoryCache _memoryCache;
        public ForgotPasswordHandler(IUserCommonRepository userCommonRepository, IMemoryCache memoryCache)
        {
            _userCommonRepository = userCommonRepository;
            _memoryCache = memoryCache;
        }
        public async Task<string> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
        {
            //var result = _userCommonRepository.ResetPasswordAsync(request);
            //return result;
            if (_memoryCache.TryGetValue($"resetPasswordToken:{request.ResetPasswordToken}", out string email))
            {
                if (!FormatHelper.IsValidPassword(request.NewPassword))
                {
                    throw new Exception(MessageConstants.MSG.MSG02);
                }
                if (request.NewPassword != request.ConfirmPassword)
                {
                    throw new Exception(MessageConstants.MSG.MSG43);
                }
                var user = await _userCommonRepository.GetUserByEmailAsync(email);
                if (user == null)
                {
                    throw new Exception(MessageConstants.MSG.MSG16);
                }
                user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                user.UpdatedAt = DateTime.Now;
                user.UpdatedBy = user.UserID;
                _memoryCache.Remove($"resetPasswordToken:{request.ResetPasswordToken}");
                var isUpdated = _userCommonRepository.ResetPasswordAsync(user);
                return MessageConstants.MSG.MSG10;
            }
            else
            {
                throw new Exception(MessageConstants.MSG.MSG79); // thời gian thực hiện hết hạn
            }
        }
    }
}
