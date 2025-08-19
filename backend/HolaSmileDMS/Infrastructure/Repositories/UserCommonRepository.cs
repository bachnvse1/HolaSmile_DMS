using Application.Interfaces;
using Application.Usecases.Administrator.ViewListUser;
using Application.Usecases.UserCommon.ViewProfile;
using HDMS_API.Application.Common.Helpers;
using HDMS_API.Application.Interfaces;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;
using HDMS_API.Application.Usecases.UserCommon.Login;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HDMS_API.Infrastructure.Repositories
{
    public class UserCommonRepository : IUserCommonRepository
    {
        private readonly ApplicationDbContext _context;

        public UserCommonRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task<User> CreatePatientAccountAsync(CreatePatientDto dto, string password)
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
                Email = dto.Email,
                IsVerify = true,
                Status = true,
                CreatedAt = DateTime.Now,
                CreatedBy = dto.CreatedBy
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }
        public async Task<bool> ResetPasswordAsync(User user)
        {
                _context.Users.Update(user);
               return await _context.SaveChangesAsync() > 0;
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

        public async Task<bool> EditProfileAsync(User user, CancellationToken cancellationToken)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }
        public async Task<User?> GetByIdAsync(int? userId, CancellationToken cancellationToken)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.UserID == userId, cancellationToken);
        }

        public async Task<List<Receptionist>> GetAllReceptionistAsync()
        {
            return await _context.Receptionists.Include(r => r.User).ToListAsync();
        }

        public async Task<List<Patient>> GetAllPatientsAsync(CancellationToken cancellationToken)
        {
            return await _context.Patients
                .Include(p => p.User)
                .Where(p => p.User.IsVerify == true && p.User.Status == true)
                .ToListAsync(cancellationToken);
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
        public async Task<UserRoleResult?> GetUserRoleAsync(string username, CancellationToken cancellationToken)
        {
            var user = await GetByUsernameAsync(username, cancellationToken);
            if (user == null) return null;

            string sql = $@"
        SELECT AdministratorId AS RoleTableId, 'Administrator' AS Role
        FROM   administrators   WHERE UserId = {user.UserID}
        UNION ALL
        SELECT AssistantId,     'Assistant'
        FROM   assistants       WHERE UserId = {user.UserID}
        UNION ALL
        SELECT DentistId,       'Dentist'
        FROM   dentists         WHERE UserId = {user.UserID}
        UNION ALL
        SELECT OwnerId,         'Owner'
        FROM   owners           WHERE UserId = {user.UserID}
        UNION ALL
        SELECT PatientID,       'Patient'
        FROM   patients         WHERE UserId = {user.UserID}
        UNION ALL
        SELECT ReceptionistId,  'Receptionist'
        FROM   receptionists    WHERE UserId = {user.UserID}
        LIMIT 1";

            return await _context.Set<UserRoleResult>()
                .FromSqlRaw(sql)
                .AsNoTracking()
                .FirstOrDefaultAsync(cancellationToken);
        }

        public async Task<List<ViewListUserDTO>> GetAllUserAsync()
        {
            //var allUsers = await _context.Users.Select(u => new
            //{
            //    u.Email,
            //    u.Fullname,
            //    u.Phone,
            //    u.CreatedAt,
            //    u.Status,
            //    Role = _context.Dentists.Any(d => d.UserId == u.UserID) ? "nha sĩ" :
            //   _context.Receptionists.Any(r => r.UserId == u.UserID) ? "lễ tân" :
            //   _context.Assistants.Any(a => a.UserId == u.UserID) ? "trợ thủ" :
            //   _context.Owners.Any(o => o.UserId == u.UserID) ? "chủ phòng khám" :
            //   _context.Patients.Any(p => p.UserID == u.UserID) ? "chủ phòng khám" : "không xác định"
            //}).Select(x => new ViewListUserDTO
            //{
            //    email = x.Email,
            //    fullName = x.Fullname,
            //    phoneNumber = x.Phone,
            //    role = x.Role,
            //    createdAt = x.CreatedAt,
            //    isActive = x.Status
            //}).ToListAsync();

            var dentistUsers = _context.Users
            .Join(_context.Dentists,
             u => u.UserID,
             d => d.UserId,
            (u, d) => new ViewListUserDTO
            {
                UserId = u.UserID,
                Email = u.Email,
                FullName = u.Fullname,
                PhoneNumber = u.Phone,
                ImageUrl = u.Avatar,
                Role = "Dentist",
                CreatedAt = u.CreatedAt,
                Status = u.Status // Status = false là bị khoá
            });

            var patientUsers = _context.Users
            .Join(_context.Patients,
             u => u.UserID,
             p => p.UserID,
            (u, d) => new ViewListUserDTO
            {
                UserId = u.UserID,
                Email = u.Email,
                FullName = u.Fullname,
                ImageUrl = u.Avatar,
                PhoneNumber = u.Phone,
                Role = "Patient",
                CreatedAt = u.CreatedAt,
                Status = u.Status
            });

            var receptionistUsers = _context.Users
                .Join(_context.Receptionists,
                    u => u.UserID,
                    r => r.UserId,
                    (u, r) => new ViewListUserDTO
                    {
                        UserId = u.UserID,
                        Email = u.Email,
                        FullName = u.Fullname,
                        ImageUrl = u.Avatar,
                        PhoneNumber = u.Phone,
                        Role = "Receptionist",
                        CreatedAt = u.CreatedAt,
                        Status = u.Status
                    });

            var assistantUsers = _context.Users
                .Join(_context.Assistants,
                    u => u.UserID,
                    a => a.UserId,
                    (u, a) => new ViewListUserDTO
                    {
                        UserId = u.UserID,
                        Email = u.Email,
                        FullName = u.Fullname,
                        ImageUrl = u.Avatar,
                        PhoneNumber = u.Phone,
                        Role = "Assistant",
                        CreatedAt = u.CreatedAt,
                        Status = u.Status
                    });

            var ownerUsers = _context.Users
                .Join(_context.Owners,
                    u => u.UserID,
                    o => o.UserId,
                    (u, o) => new ViewListUserDTO
                    {
                        UserId = u.UserID,
                        Email = u.Email,
                        FullName = u.Fullname,
                        ImageUrl = u.Avatar,
                        PhoneNumber = u.Phone,
                        Role = "Owner",
                        CreatedAt = u.CreatedAt,
                        Status = u.Status
                    });

            var allUsers = await dentistUsers
                          .Union(receptionistUsers)
                          .Union(assistantUsers)
                          .Union(ownerUsers)
                          .Union(patientUsers)
                          .ToListAsync();

            return allUsers;
        }

        public async Task<bool> CreateUserAsync(User user, string role)
        {
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
            switch (role.ToLower())
            {
                case "dentist":
                    var dentist = new Dentist { UserId = user.UserID };
                    await _context.Dentists.AddAsync(dentist);
                    break;
                case "receptionist":
                    var receptionist = new Receptionist { UserId = user.UserID };
                    await _context.Receptionists.AddAsync(receptionist);
                    break;
                case "assistant":
                    var assistant = new Assistant { UserId = user.UserID };
                    await _context.Assistants.AddAsync(assistant);
                    break;
                case "owner":
                    var owner = new Owner { UserId = user.UserID };
                    await _context.Owners.AddAsync(owner);
                    break;
                default:
                    return false;
            }
            return await _context.SaveChangesAsync() > 0;
        }
        public async Task<bool> UpdateUserStatusAsync(int userId, int updatedBy)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserID == userId);
            if (user == null)
            {
                return false;
            }
            user.Status = !user.Status; // Đảo ngược trạng thái
            user.UpdatedAt = DateTime.Now;
            user.UpdatedBy = updatedBy;
            _context.Users.Update(user);
            return await _context.SaveChangesAsync() > 0;
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
