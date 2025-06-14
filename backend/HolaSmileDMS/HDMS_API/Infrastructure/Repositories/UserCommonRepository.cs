using HDMS_API.Application.Common.Helpers;
using HDMS_API.Application.Interfaces;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;
using HDMS_API.Application.Usecases.UserCommon.Otp;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;

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
        public async Task<User> CreatePatientAccountAsync(CreatePatientCommand request, string password )
        {
            if(await _context.Users.AnyAsync(u => u.Phone == request.PhoneNumber))
            {
                throw new Exception("Tài khoản với số điện thoại này đã tồn tại.");
            }

            if (request.FullName.IsNullOrEmpty()){
                throw new Exception("Tên bệnh nhân không được để trống.");
            }

            if (!FormatHelper.FormatPhoneNumber(request.PhoneNumber))
            {
                throw new Exception("Số điện thoại không hợp lệ.");
            }

            if (FormatHelper.TryParseDob(request.Dob) == null)
            {
                throw new Exception("Ngày sinh không hợp lệ.");
            }
            if (!FormatHelper.IsValidEmail(request.Email))
            {
                throw new Exception("Email không hợp lệ.");
            }
            if(await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                throw new Exception("Email này đã tồn tại .");
            }
            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);

            var user = new User
            {
                Username = request.PhoneNumber,
                Password = hashedPassword,
                Fullname = request.FullName,
                Gender = request.Gender,
                Address = request.Adress,
                DOB = FormatHelper.TryParseDob(request.Dob),
                Phone = request.PhoneNumber,
                Email = request.Email,
                IsVerify = true,
                Status = true ,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = request.Createdby 
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
                ExpiryTime = DateTime.Now.AddMinutes(2) // tuy chinh
            };
            _memoryCache.Set($"otp:{toEmail}", otp, otp.ExpiryTime - DateTime.UtcNow);

            return true;
        }

        public async Task<bool> VerifyOtpAsync(VerifyOtpCommand otp)
        {
            if(_memoryCache.TryGetValue($"otp:{otp.Email}", out RequestOtpDto cachedOtp))
            {
                if (cachedOtp.Otp == otp.Otp && cachedOtp.ExpiryTime > DateTime.Now)
                {
                    _memoryCache.Remove($"otp:{otp.Email}");
                    return true;
                }
                else
                {
                    throw new Exception("Mã OTP không hợp lệ .");
                }
            }
            else
            {
                throw new Exception("OTP đã hết hạn.");
            }
        }
    }
}
