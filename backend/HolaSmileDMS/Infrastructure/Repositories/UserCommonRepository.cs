using HDMS_API.Application.Common.Helpers;
using HDMS_API.Application.Interfaces;
using HDMS_API.Application.Usecases.Auth.ForgotPassword;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;
using HDMS_API.Application.Usecases.UserCommon.Login;
using HDMS_API.Application.Usecases.UserCommon.Otp;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using System.Threading;

namespace HDMS_API.Infrastructure.Repositories
{
    public class UserCommonRepository : IUserCommonRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IMemoryCache _memoryCache;
        public UserCommonRepository(ApplicationDbContext context,IEmailService emailService, IMemoryCache memoryCache)
        {
            _context = context;
            _emailService = emailService;
            _memoryCache = memoryCache;
        }
        public async Task<User> CreatePatientAccountAsync(CreatePatientDto dto, string password )
        {
            if(await _context.Users.AnyAsync(u => u.Phone == dto.PhoneNumber))
            {
                throw new Exception("Tài khoản với số điện thoại này đã tồn tại.");
            }

            if (dto.FullName.IsNullOrEmpty()){
                throw new Exception("Tên bệnh nhân không được để trống.");
            }

            if (!FormatHelper.FormatPhoneNumber(dto.PhoneNumber))
            {
                throw new Exception("Số điện thoại không hợp lệ.");
            }

            if (dto.Dob != null && FormatHelper.TryParseDob(dto.Dob) == null)
            {
                throw new Exception("Ngày sinh không hợp lệ.");
            }
            if (!FormatHelper.IsValidEmail(dto.Email))
            {
                throw new Exception("Email không hợp lệ.");
            }
            if(await _context.Users.AnyAsync(u => u.Email == dto.Email))
            {
                throw new Exception("Email này đã tồn tại .");
            }
            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);

            var user = new User
            {
                Username = dto.PhoneNumber,
                Password = hashedPassword,
                Fullname = dto.FullName,
                Gender = dto.Gender,
                Address = dto.Address,
                DOB = FormatHelper.TryParseDob(dto.Dob),
                Phone = dto.PhoneNumber,
                Email = dto .Email,
                IsVerify = true,
                Status = true ,
                CreatedAt = DateTime.Now,
                CreatedBy = dto.CreatedBy 
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }


        public async Task<bool> SendPasswordForGuestAsync(string email)
        {
            if(email.IsNullOrEmpty() || !FormatHelper.IsValidEmail(email))
            {
                throw new Exception("Email không hợp lệ.");
            }
            return await _emailService.SendPasswordAsync(email, "123456"); ;
        }

        public async Task<bool> SendOtpEmailAsync(string toEmail)
        {
            if (FormatHelper.IsValidEmail(toEmail) == false)
            {
                throw new Exception("Email không hợp lệ.");
            }
            var OtpCode = await _emailService.GenerateOTP();
            var IsSent = await _emailService.SendOtpEmailAsync(toEmail, OtpCode);
            if (!IsSent)
            {
                throw new Exception("Gửi email OTP không thành công.");
            }
            var otp = new RequestOtpDto
            {
                Email = toEmail,
                Otp = OtpCode,
                ExpiryTime = DateTime.Now.AddMinutes(5), // tuy chinh
                SendTime = DateTime.Now,
                RetryCount = 0
            };
            _memoryCache.Set($"otp:{toEmail}", otp, otp.ExpiryTime - DateTime.Now);

            return true;
        }
        public async Task<bool> ResendOtpAsync(string toEmail)
        {
            if(_memoryCache.TryGetValue($"otp:{toEmail}", out RequestOtpDto cachedOtp))
            {
                if (cachedOtp.SendTime.AddMinutes(1) < DateTime.Now)
                {
                    return await SendOtpEmailAsync(toEmail);
                }
                else
                {
                    throw new Exception("Bạn chỉ có thể gửi lại OTP sau 2 phút.");
                }
            }
            else
            {
                throw new Exception("Gửi lại OTP thất bại.");
            }
        }


        public async Task<string> VerifyOtpAsync(VerifyOtpCommand otp)
        {
            if(_memoryCache.TryGetValue($"otp:{otp.Email}", out RequestOtpDto cachedOtp))
            {
                if (cachedOtp.RetryCount > 5)
                {
                    throw new Exception("Bạn đã nhập sai OTP quá 5 lần. Vui lòng lấy lại OTP.");
                }
                if (cachedOtp.Otp == otp.Otp && cachedOtp.ExpiryTime > DateTime.Now)
                {
                    _memoryCache.Remove($"otp:{otp.Email}");
                    var resetPasswordToken = Guid.NewGuid().ToString();
                    _memoryCache.Set($"resetPasswordToken:{resetPasswordToken}", otp.Email, TimeSpan.FromMinutes(15)); // Token hợp lệ trong 15 phút
                    return resetPasswordToken;
                }
                else
                {
                    cachedOtp.RetryCount++;
                    _memoryCache.Set($"otp:{otp.Email}", cachedOtp, cachedOtp.ExpiryTime - DateTime.Now);
                    throw new Exception("Mã OTP không hợp lệ .");
                }
            }
            else
            {
                throw new Exception("OTP đã hết hạn.");
            }
        }

        public async Task<string> ResetPasswordAsync(ForgotPasswordCommand request)
        {
            if(_memoryCache.TryGetValue($"resetPasswordToken:{request.ResetPasswordToken}", out string email))
            {
                if (!FormatHelper.IsValidPassword(request.NewPassword))
                {
                    throw new Exception("Mật khẩu mới không hợp lệ. Mật khẩu phải chứa ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.");
                }
                if (request.NewPassword != request.ConfirmPassword)
                {
                    throw new Exception("Mật khẩu xác nhận không khớp với mật khẩu mới.");
                }
                    var user = _context.Users.FirstOrDefault(u => u.Email == email);
                    if (user == null)
                    {
                        throw new Exception("Người dùng không tồn tại.");
                    }
                    user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                    user.UpdatedAt = DateTime.Now;
                    user.UpdatedBy = user.UserID;
                    _context.Users.Update(user);
                    _context.SaveChanges();
                    _memoryCache.Remove($"resetPasswordToken:{request.ResetPasswordToken}");
                    return "Đặt lại mật khẩu thành công.";
             }
            else
            {
                throw new Exception("Thời gian đặt lại mật khẩu của bạn đã hết. Vui lòng quên mật khẩu lại.");
            }
        }

        public async Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken)
        {
            return await _context.Users.FirstOrDefaultAsync(x => x.Username == username, cancellationToken);
        }


        public Task<User?> GetByEmailAsync(string email)
        {
            throw new NotImplementedException();
        }

    }
}
