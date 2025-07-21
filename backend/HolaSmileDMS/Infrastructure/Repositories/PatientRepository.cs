using Application.Interfaces;
using Application.Usecases.Patients.ViewListPatient;
using Application.Usecases.Patients.ViewListPatient;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
namespace HDMS_API.Infrastructure.Repositories
{
    public class PatientRepository : IPatientRepository
    {
        private readonly ApplicationDbContext _context;
        public PatientRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task<Patient> CreatePatientAsync(CreatePatientDto dto,int userID)
        {
            var patient = new Patient
            {
                UserID = userID,
                PatientGroup = dto.PatientGroup,
                UnderlyingConditions = dto.UnderlyingConditions,
                CreatedAt = DateTime.Now,
                CreatedBy = dto.CreatedBy,
            };
            _context.Patients.Add(patient);
            await _context.SaveChangesAsync();
            return patient;
        }

        public async Task<List<ViewListPatientDto>> GetAllPatientsAsync(CancellationToken cancellationToken)
        {
            return await _context.Patients
                .Where(p => p.User != null)
                .Include(p => p.User)
                .OrderBy(p => p.User.Fullname)
                .Select(p => new ViewListPatientDto
                {
                    UserId = p.UserID ?? 0,
                    PatientId = p.PatientID,
                    Fullname = p.User.Fullname ?? "",
                    Gender = p.User.Gender.HasValue ? (p.User.Gender.Value ? "Male" : "Female") : null,
                    Phone = p.User.Phone,
                    DOB = p.User.DOB,   
                    Email = p.User.Email,
                    Address = p.User.Address,
                    UnderlyingConditions = p.UnderlyingConditions
                })
                .ToListAsync(cancellationToken);
        }


        public async Task<Patient> GetPatientByPatientIdAsync(int? patientId)
        {
            var patient = await _context.Patients.Include(p => p.User).FirstOrDefaultAsync(p => p.PatientID == patientId);
            return patient;
        }

        public async Task<Patient> GetPatientByUserIdAsync(int userId)
        {
            var patient = await _context.Patients.Include(p => p.User).FirstOrDefaultAsync(p => p.UserID == userId);
            return patient;
        }

        public async Task<bool> UpdatePatientInforAsync(Patient patient)
        {
            _context.Patients.Update(patient);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<Patient> CheckEmailPatientAsync(string email)
        {
            var patient = await _context.Patients
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.User.Email == email);
            return patient;
        }

    }
}
