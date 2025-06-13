using HDMS_API.Application.Common.Helpers;
using HDMS_API.Application.Interfaces;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace HDMS_API.Infrastructure.Repositories
{
    public class UserCommonRepository : IUserCommonRepository
    {
        private readonly ApplicationDbContext _context;
        public UserCommonRepository(ApplicationDbContext context)
        {
            _context = context;
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
    }
}
