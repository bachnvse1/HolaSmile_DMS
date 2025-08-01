using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using HDMS_API.Application.Common.Helpers;
using HDMS_API.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity.UI.Services;

namespace Application.Usecases.Administrator.CreateUser
{
    public class CreateUserHandler : IRequestHandler<CreateUserCommand, bool>
    {
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IEmailService _emailService;
        public  CreateUserHandler(IUserCommonRepository userCommonRepository, IHttpContextAccessor httpContextAccessor, IEmailService emailService)
        {
            _userCommonRepository = userCommonRepository;
            _httpContextAccessor = httpContextAccessor;
            _emailService = emailService;
        }

        public async Task<bool> Handle(CreateUserCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (currentUserRole == null)
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53); // "Bạn cần đăng nhập..."
            }

            if (!string.Equals(currentUserRole, "administrator", StringComparison.OrdinalIgnoreCase))
            {
                throw new Exception(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"
            }

            if (string.IsNullOrEmpty(request.FullName))
            {
                throw new Exception(MessageConstants.MSG.MSG07);
            }
            if (!FormatHelper.FormatPhoneNumber(request.PhoneNumber))
            {
                throw new Exception(MessageConstants.MSG.MSG56); // "Số điện thoại không đúng định dạng"
            }
            if (await _userCommonRepository.GetUserByPhoneAsync(request.PhoneNumber) != null)
            {
                throw new Exception(MessageConstants.MSG.MSG23); // "Email đã tồn tại"
            }
            if (!FormatHelper.IsValidEmail(request.Email))
            {
                throw new Exception(MessageConstants.MSG.MSG08); // "Định dạng email không hợp lệ"
            }
            if (await _userCommonRepository.GetUserByEmailAsync(request.Email) != null)
            {
                throw new Exception(MessageConstants.MSG.MSG22); // "Email đã tồn tại"
            }

            var hashedPassword = BCrypt.Net.BCrypt.HashPassword("123456");

            var newUser = new User
            {
                Username = request.PhoneNumber,
                Password = hashedPassword,
                Fullname = request.FullName,
                Gender = request.Gender,
                Phone = request.PhoneNumber,
                Email = request.Email,
                IsVerify = true,
                Status = true,
                CreatedAt = DateTime.Now,
                CreatedBy = currentUserId
            };

            if(request.Role.ToLower() != "dentist" && request.Role.ToLower() != "receptionist" && request.Role.ToLower() != "assistant" && request.Role.ToLower() != "owner")
            {
                throw new Exception("Vai trò nhân viên không hợp lệ");
            }

            _ = System.Threading.Tasks.Task.Run(async () =>
            {
                try
                {
                    await _emailService.SendPasswordAsync(newUser.Email,"123456");
                }
                catch (Exception ex)
                {
                    throw new Exception(MessageConstants.MSG.MSG78); // => Gợi ý định nghĩa: "Gửi mật khẩu cho khách không thành công."
                }
            });

            var isCreaeted = await _userCommonRepository.CreateUserAsync(newUser,request.Role);
            return isCreaeted ;

        }
    }
}
