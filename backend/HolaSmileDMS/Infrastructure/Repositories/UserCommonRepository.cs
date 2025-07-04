﻿using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Patients.ViewListPatient;
using Application.Usecases.UserCommon.ViewProfile;
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
                throw new Exception(MessageConstants.MSG.MSG08);
            }
            return await _emailService.SendPasswordAsync(email, "123456"); ;
        }
        public async Task<bool> SendOtpEmailAsync(string toEmail)
        {
            if (FormatHelper.IsValidEmail(toEmail) == false)
            {
                throw new Exception(MessageConstants.MSG.MSG08);
            }
            var OtpCode = await _emailService.GenerateOTP();
            var IsSent = await _emailService.SendOtpEmailAsync(toEmail, OtpCode);
            if (!IsSent)
            {
                throw new Exception(MessageConstants.MSG.MSG78); // Gửi email không thành công
            }
            var otp = new RequestOtpDto
            {
                Email = toEmail,
                Otp = OtpCode,
                ExpiryTime = DateTime.Now.AddMinutes(2)
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
                    throw new Exception("Bạn chỉ có thể gửi lại OTP sau 1 phút.");
                }
            }
            else
            {
                throw new Exception(MessageConstants.MSG.MSG78); // Gửi mã OTP không thành công
            }
        }
        public async Task<string> VerifyOtpAsync(VerifyOtpCommand otp)
        {
            if (_memoryCache.TryGetValue($"otp:{otp.Email}", out RequestOtpDto cachedOtp))
            {
                if (cachedOtp.Otp == otp.Otp && cachedOtp.ExpiryTime > DateTime.Now)
                {
                    _memoryCache.Remove($"otp:{otp.Email}");
                    var resetPasswordToken = Guid.NewGuid().ToString();
                    _memoryCache.Set($"resetPasswordToken:{resetPasswordToken}", otp.Email, TimeSpan.FromMinutes(15)); // Token hợp lệ trong 15 phút
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
        public async Task<string> ResetPasswordAsync(ForgotPasswordCommand request)
        {
            if(_memoryCache.TryGetValue($"resetPasswordToken:{request.ResetPasswordToken}", out string email))
            {
                if (!FormatHelper.IsValidPassword(request.NewPassword))
                {
                    throw new Exception(MessageConstants.MSG.MSG02);
                }
                if (request.NewPassword != request.ConfirmPassword)
                {
                    throw new Exception(MessageConstants.MSG.MSG43);
                }
                var user = _context.Users.FirstOrDefault(u => u.Email == email);
                    if (user == null)
                    {
                    throw new Exception(MessageConstants.MSG.MSG16);
                }
                user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                    user.UpdatedAt = DateTime.Now;
                    user.UpdatedBy = user.UserID;
                    _context.Users.Update(user);
                    _context.SaveChanges();
                    _memoryCache.Remove($"resetPasswordToken:{request.ResetPasswordToken}");
                    return MessageConstants.MSG.MSG10;
                ;
            }
            else
            {
                throw new Exception(MessageConstants.MSG.MSG79); // thời gian thực hiện hết hạn
            }
        }
        public async Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken)
        {
            return await _context.Users.FirstOrDefaultAsync(x => x.Username == username, cancellationToken);
        }
        public Task<User?> GetUserByPhoneAsync(string phone)
        {
            var user = _context.Users.FirstOrDefaultAsync(u => u.Phone == phone);
            return user;
        }
        public Task<User?> GetUserByEmailAsync(string email)
        {
            var user = _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            return user;
        }

        public Task<User?> GetByEmailAsync(string email)
        {
            throw new NotImplementedException();
        }
        public async Task<bool> EditProfileAsync(User user, CancellationToken cancellationToken)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }
        public async Task<User?> GetByIdAsync(int userId, CancellationToken cancellationToken)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.UserID == userId, cancellationToken);
        }

        public async Task<List<Receptionist>> GetAllReceptionistAsync()
        {
            return await _context.Receptionists.Include(r => r.User).ToListAsync();
        }

        public Task<List<ViewListPatientDto>> GetAllPatientsAsync(CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public async Task<ViewProfileDto?> GetUserProfileAsync(int userId, CancellationToken cancellationToken)
        {
            return await _context.Users
                .Where(u => u.UserID == userId)
                .Select(u => new ViewProfileDto
                {
                    UserID = u.UserID,
                    Username = u.Username,
                    Fullname = u.Fullname,
                    Gender = u.Gender,
                    Address = u.Address,
                    DOB = u.DOB,
                    Phone = u.Phone,
                    Email = u.Email,
                    Avatar = u.Avatar
                })
                .FirstOrDefaultAsync(cancellationToken);
        }
        public async Task<UserRoleResult?> GetUserRoleAsync(
            string username,
            CancellationToken cancellationToken)
        {
            var user = await GetByUsernameAsync(username, cancellationToken);
            if (user == null) return null;

            string sql = $@"
        SELECT AdministratorId AS RoleTableId, 'Administrator' AS Role
        FROM   Administrators   WHERE UserId = {user.UserID}
        UNION ALL
        SELECT AssistantId,     'Assistant'
        FROM   Assistants       WHERE UserId = {user.UserID}
        UNION ALL
        SELECT DentistId,       'Dentist'
        FROM   Dentists         WHERE UserId = {user.UserID}
        UNION ALL
        SELECT OwnerId,         'Owner'
        FROM   Owners           WHERE UserId = {user.UserID}
        UNION ALL
        SELECT PatientID,       'Patient'
        FROM   Patients         WHERE UserId = {user.UserID}
        UNION ALL
        SELECT ReceptionistId,  'Receptionist'
        FROM   Receptionists    WHERE UserId = {user.UserID}
        LIMIT 1";

            return await _context.Set<UserRoleResult>()
                .FromSqlRaw(sql)
                .AsNoTracking()
                .FirstOrDefaultAsync(cancellationToken);
        }
        
        public async Task<int?> GetUserIdByRoleTableIdAsync(string role, int id)
        {
            return role.ToLower() switch
            {
                "patient" => await _context.Patients
                    .Where(p => p.PatientID == id)
                    .Select(p => (int?)p.UserID)
                    .FirstOrDefaultAsync(),

                "dentist" => await _context.Dentists
                    .Where(d => d.DentistId == id)
                    .Select(d => (int?)d.UserId)
                    .FirstOrDefaultAsync(),

                "assistant" => await _context.Assistants
                    .Where(a => a.AssistantId == id)
                    .Select(a => (int?)a.UserId)
                    .FirstOrDefaultAsync(),

                "receptionist" => await _context.Receptionists
                    .Where(r => r.ReceptionistId == id)
                    .Select(r => (int?)r.UserId)
                    .FirstOrDefaultAsync(),

                "owner" => await _context.Owners
                    .Where(o => o.OwnerId == id)
                    .Select(o => (int?)o.UserId)
                    .FirstOrDefaultAsync(),

                "administrator" => await _context.Administrators
                    .Where(ad => ad.AdministratorId == id)
                    .Select(ad => (int?)ad.UserId)
                    .FirstOrDefaultAsync(),

                _ => null
            };
        }

    }
}
