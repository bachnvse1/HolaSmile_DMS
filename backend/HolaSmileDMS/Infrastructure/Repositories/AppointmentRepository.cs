using System.Linq;
using Application.Interfaces;
using Application.Usecases.UserCommon.ViewAppointment;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HDMS_API.Infrastructure.Repositories
{
    public class AppointmentRepository : IAppointmentRepository
    {
        private readonly ApplicationDbContext _context;
        public AppointmentRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task<bool> CreateAppointmentAsync(Appointment appointment)
        {
            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<AppointmentDTO?> GetDetailAppointmentByAppointmentIDAsync(int appointmentId)
        {
            var appointment = await _context.Appointments
                .Include(a => a.Patient).ThenInclude(p => p.User)
                .Include(a => a.Dentist).ThenInclude(d => d.User)
                .FirstOrDefaultAsync(appointments => appointments.AppointmentId == appointmentId && !appointments.IsDeleted);


            var prescriptionIds = await _context.Prescriptions
                .Where(p => appointment.AppointmentId == p.AppointmentId)
                .Select(p => p.AppointmentId)
                .Distinct()
                .ToListAsync();

            var instructionIds = await _context.Instructions
                .Where(i => appointment.AppointmentId == i.AppointmentId)
                .Select(i => i.AppointmentId)
                .Distinct()
                .ToListAsync();


            var result = new AppointmentDTO
            {
                AppointmentId = appointment.AppointmentId,
                PatientName = appointment.Patient.User.Fullname,
                DentistName = appointment.Dentist.User.Fullname,
                AppointmentDate = appointment.AppointmentDate,
                AppointmentTime = appointment.AppointmentTime,
                Content = appointment.Content,
                AppointmentType = appointment.AppointmentType,
                IsNewPatient = appointment.IsNewPatient,
                Status = appointment.Status,
                CreatedAt = appointment.CreatedAt,
                UpdatedAt = appointment.UpdatedAt,
                CreatedBy = appointment.CreatedBy,
                UpdatedBy = appointment.UpdatedBy,
                IsExistPrescription = prescriptionIds.Contains(appointment.AppointmentId),
                IsExistInstruction = instructionIds.Contains(appointment.AppointmentId)
            };

            return result;
        }
        public async Task<List<AppointmentDTO>> GetAppointmentsByPatientIdAsync(int userID)
        {
            var appointments = await _context.Appointments
                .Include(a => a.Patient).ThenInclude(p => p.User)
                .Include(a => a.Dentist).ThenInclude(d => d.User)
                .Where(a => a.Patient.User.UserID == userID && !a.IsDeleted).OrderBy(a => a.AppointmentId)
                .ToListAsync();
            
            var appIds = appointments.Select(a => a.AppointmentId).ToList();

            var prescriptionIds = await _context.Prescriptions
                .Where(p => appIds.Contains(p.AppointmentId.Value))
                .Select(p => p.AppointmentId)
                .Distinct()
                .ToListAsync();

            var instructionIds = await _context.Instructions
                .Where(i => appIds.Contains(i.AppointmentId.Value))
                .Select(i => i.AppointmentId)
                .Distinct()
                .ToListAsync();


            var result = appointments.Select(a => new AppointmentDTO
            {
                AppointmentId = a.AppointmentId,
                PatientName = a.Patient.User.Fullname,
                DentistName = a.Dentist.User.Fullname,
                AppointmentDate = a.AppointmentDate,
                AppointmentTime = a.AppointmentTime,
                Content = a.Content,
                AppointmentType = a.AppointmentType,
                IsNewPatient = a.IsNewPatient,
                Status = a.Status,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                CreatedBy = a.CreatedBy,
                UpdatedBy = a.UpdatedBy,
                IsExistPrescription = prescriptionIds.Contains(a.AppointmentId),
                IsExistInstruction = instructionIds.Contains(a.AppointmentId)
            }).ToList();

            return result;
        }

        public async Task<List<AppointmentDTO>> GetAppointmentsByDentistIdAsync(int userID)
        {
            var appointments = await _context.Appointments
                .Include(a => a.Patient).ThenInclude(p => p.User)
                .Include(a => a.Dentist).ThenInclude(d => d.User)
                .Where(a => a.Dentist.User.UserID == userID && !a.IsDeleted).OrderBy(a => a.AppointmentId)
                .ToListAsync();

            var appIds = appointments.Select(a => a.AppointmentId).ToList();

            var prescriptionIds = await _context.Prescriptions
                .Where(p => appIds.Contains(p.AppointmentId.Value))
                .Select(p => p.AppointmentId)
                .Distinct()
                .ToListAsync();

            var instructionIds = await _context.Instructions
                .Where(i => appIds.Contains(i.AppointmentId.Value))
                .Select(i => i.AppointmentId)
                .Distinct()
                .ToListAsync();


            var result = appointments.Select(a => new AppointmentDTO
            {
                AppointmentId = a.AppointmentId,
                PatientName = a.Patient.User.Fullname,
                DentistName = a.Dentist.User.Fullname,
                AppointmentDate = a.AppointmentDate,
                AppointmentTime = a.AppointmentTime,
                Content = a.Content,
                AppointmentType = a.AppointmentType,
                IsNewPatient = a.IsNewPatient,
                Status = a.Status,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                CreatedBy = a.CreatedBy,
                UpdatedBy = a.UpdatedBy,
                IsExistPrescription = prescriptionIds.Contains(a.AppointmentId),
                IsExistInstruction = instructionIds.Contains(a.AppointmentId)
            }).ToList();

            return result;
        }

        public async Task<List<AppointmentDTO>> GetAllAppointmentAsync()
        {
            var appointments = await _context.Appointments
                 .Include(a => a.Patient).ThenInclude(p => p.User)
                 .Include(a => a.Dentist).ThenInclude(d => d.User)
                 .OrderBy(a => a.AppointmentId)
                 .ToListAsync();

            var appIds = appointments.Select(a => a.AppointmentId).ToList();

            var prescriptionIds = await _context.Prescriptions
                .Where(p => appIds.Contains(p.AppointmentId.Value))
                .Select(p => p.AppointmentId)
                .Distinct()
                .ToListAsync();

            var instructionIds = await _context.Instructions
                .Where(i => appIds.Contains(i.AppointmentId.Value))
                .Select(i => i.AppointmentId)
                .Distinct()
                .ToListAsync();


            var result = appointments.Select(a => new AppointmentDTO
            {
                AppointmentId = a.AppointmentId,
                PatientName = a.Patient.User.Fullname,
                DentistName = a.Dentist.User.Fullname,
                AppointmentDate = a.AppointmentDate,
                AppointmentTime = a.AppointmentTime,
                Content = a.Content,
                AppointmentType = a.AppointmentType,
                IsNewPatient = a.IsNewPatient,
                Status = a.Status,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                CreatedBy = a.CreatedBy,
                UpdatedBy = a.UpdatedBy,
                IsExistPrescription = prescriptionIds.Contains(a.AppointmentId),
                IsExistInstruction = instructionIds.Contains(a.AppointmentId)
            }).ToList();

            return result;
        }
        public async Task<Appointment> GetAppointmentByIdAsync(int appointmentId)
        {
            var result = await _context.Appointments
                .Include(a => a.Patient)
                .ThenInclude(p => p.User)
                .Include(a => a.Dentist)
                .ThenInclude(d => d.User)
                .FirstOrDefaultAsync(a => a.AppointmentId == appointmentId);
            return result ;
        }
        public async Task<bool> CancelAppointmentAsync(int appId, int CancleBy)
        {
            var appointment = await _context.Appointments
                .FirstOrDefaultAsync(a => a.AppointmentId == appId && !a.IsDeleted);
            if (appointment == null)
            {
                return false;
            }
            appointment.Status = "canceled";
            appointment.UpdatedAt = DateTime.Now;
            appointment.UpdatedBy = CancleBy;
            _context.Appointments.Update(appointment);
            var result = await _context.SaveChangesAsync();
            return true;
        }
        public async Task<bool> CheckPatientAppointmentByUserIdAsync(int appId, int userId)
        {
            var result = await _context.Appointments.AnyAsync(a => a.AppointmentId == appId && a.Patient.User.UserID == userId);
            return result;
        }
        public async Task<bool> CheckDentistAppointmentByUserIdAsync(int appId, int userId)
        {
            var result = await _context.Appointments.AnyAsync(a => a.AppointmentId == appId && a.Dentist.User.UserID == userId);
            return result;
        }
        public async Task<bool> ExistsAppointmentAsync(int patientId, DateTime date)
        {
            return await _context.Appointments
            .AnyAsync(a => a.PatientId == patientId
                        && a.AppointmentDate.Date == date.Date
                        && a.Status != "canceled");
        }
        public async Task<Appointment?> GetLatestAppointmentByPatientIdAsync(int? patientId)
        {
            return await _context.Appointments
                .OrderByDescending(a => a.AppointmentDate)
                .ThenByDescending(a => a.AppointmentTime)
                .Where(a => a.PatientId == patientId && !a.IsDeleted)
                .FirstOrDefaultAsync();
        }

        public async Task<bool> UpdateAppointmentAsync(Appointment appointment)
        {
            _context.Appointments.Update(appointment);
            await _context.SaveChangesAsync();
            return true;
        }

    }
}
