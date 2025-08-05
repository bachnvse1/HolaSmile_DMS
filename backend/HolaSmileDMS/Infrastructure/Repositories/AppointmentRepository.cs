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
            // Lấy appointment bao gồm user/patient/dentist
            var appointment = await _context.Appointments
                .Include(a => a.Patient).ThenInclude(p => p.User)
                .Include(a => a.Dentist).ThenInclude(d => d.User)
                .FirstOrDefaultAsync(a => a.AppointmentId == appointmentId && !a.IsDeleted);

            if (appointment == null)
                return null;

            var prescription = await _context.Prescriptions
                .FirstOrDefaultAsync(p => p.AppointmentId == appointmentId);

            var instruction = await _context.Instructions
                .FirstOrDefaultAsync(i => i.AppointmentId == appointmentId);

            // Mapping thủ công sang DTO
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
                patientId = appointment.Patient.PatientID,
                Status = appointment.Status,
                CreatedAt = appointment.CreatedAt,
                UpdatedAt = appointment.UpdatedAt,
                CreatedBy = appointment.CreatedBy.ToString(),
                UpdatedBy = appointment.UpdatedBy.ToString(),

                // Gắn thông tin Prescription / Instruction
                IsExistPrescription = prescription != null,
                IsExistInstruction = instruction != null,
                PrescriptionId = prescription?.PrescriptionId,
                InstructionId = instruction?.InstructionID
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

            var prescriptionDict = await _context.Prescriptions
              .Where(p => p.AppointmentId != null && appIds.Contains(p.AppointmentId.Value))
              .ToDictionaryAsync(p => p.AppointmentId!.Value);

            var instructionDict = await _context.Instructions
                .Where(i => i.AppointmentId != null && appIds.Contains(i.AppointmentId.Value))
                .ToDictionaryAsync(i => i.AppointmentId!.Value);


            var result = appointments.Select(app =>
            {
                prescriptionDict.TryGetValue(app.AppointmentId, out var pres);
                instructionDict.TryGetValue(app.AppointmentId, out var inst);

                return new AppointmentDTO
                {
                    AppointmentId = app.AppointmentId,
                    PatientName = app.Patient.User.Fullname,
                    DentistName = app.Dentist.User.Fullname,
                    AppointmentDate = app.AppointmentDate,
                    AppointmentTime = app.AppointmentTime,
                    Content = app.Content,
                    AppointmentType = app.AppointmentType,
                    IsNewPatient = app.IsNewPatient,
                    patientId = app.Patient.PatientID,
                    Status = app.Status,
                    CreatedAt = app.CreatedAt,
                    UpdatedAt = app.UpdatedAt,
                    CreatedBy = app.CreatedBy.ToString(),
                    UpdatedBy = app.UpdatedBy.ToString(),
                    IsExistPrescription = pres != null,
                    IsExistInstruction = inst != null,
                    PrescriptionId = pres?.PrescriptionId,
                    InstructionId = inst?.InstructionID
                };
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

            var prescriptionDict = await _context.Prescriptions
              .Where(p => p.AppointmentId != null && appIds.Contains(p.AppointmentId.Value))
              .ToDictionaryAsync(p => p.AppointmentId!.Value);

            var instructionDict = await _context.Instructions
                .Where(i => i.AppointmentId != null && appIds.Contains(i.AppointmentId.Value))
                .ToDictionaryAsync(i => i.AppointmentId!.Value);


            var result = appointments.Select(app =>
            {
                prescriptionDict.TryGetValue(app.AppointmentId, out var pres);
                instructionDict.TryGetValue(app.AppointmentId, out var inst);

                return new AppointmentDTO
                {
                    AppointmentId = app.AppointmentId,
                    PatientName = app.Patient.User.Fullname,
                    DentistName = app.Dentist.User.Fullname,
                    AppointmentDate = app.AppointmentDate,
                    AppointmentTime = app.AppointmentTime,
                    Content = app.Content,
                    AppointmentType = app.AppointmentType,
                    IsNewPatient = app.IsNewPatient,
                    patientId = app.Patient.PatientID,
                    Status = app.Status,
                    CreatedAt = app.CreatedAt,
                    UpdatedAt = app.UpdatedAt,
                    CreatedBy = app.CreatedBy.ToString(),
                    UpdatedBy = app.UpdatedBy.ToString(),
                    IsExistPrescription = pres != null,
                    IsExistInstruction = inst != null,
                    PrescriptionId = pres?.PrescriptionId,
                    InstructionId = inst?.InstructionID
                };
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

            // Dùng dictionary để truy nhanh theo AppointmentId
            var prescriptionDict = await _context.Prescriptions
               .Where(p => p.AppointmentId != null && appIds.Contains(p.AppointmentId.Value))
               .ToDictionaryAsync(p => p.AppointmentId!.Value); 

            var instructionDict = await _context.Instructions
                .Where(i => i.AppointmentId != null && appIds.Contains(i.AppointmentId.Value))
                .ToDictionaryAsync(i => i.AppointmentId!.Value);


            var result = appointments.Select(app =>
            {
                prescriptionDict.TryGetValue(app.AppointmentId, out var pres);
                instructionDict.TryGetValue(app.AppointmentId, out var inst);

                return new AppointmentDTO
                {
                    AppointmentId = app.AppointmentId,
                    PatientName = app.Patient.User.Fullname,
                    DentistName = app.Dentist.User.Fullname,
                    AppointmentDate = app.AppointmentDate,
                    AppointmentTime = app.AppointmentTime,
                    Content = app.Content,
                    AppointmentType = app.AppointmentType,
                    IsNewPatient = app.IsNewPatient,
                    patientId = app.Patient.PatientID,
                    Status = app.Status,
                    CreatedAt = app.CreatedAt,
                    UpdatedAt = app.UpdatedAt,
                    CreatedBy = app.CreatedBy.ToString(),
                    UpdatedBy = app.UpdatedBy.ToString(),
                    IsExistPrescription = pres != null,
                    IsExistInstruction = inst != null,
                    PrescriptionId = pres?.PrescriptionId,
                    InstructionId = inst?.InstructionID
                };
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
            return await _context.SaveChangesAsync() > 0;
        }
        public async Task<List<Appointment>> GetAppointmentsByPatient(int userId)
        {
            return await _context.Appointments
                .Include(a => a.Patient).ThenInclude(p => p.User)
                .Include(a => a.Dentist).ThenInclude(d => d.User)
                .Where(a => a.Patient.User.UserID == userId && !a.IsDeleted)
                .ToListAsync();
        }

        public async Task<List<Appointment>> GetAllAppointments()
        {
            return await _context.Appointments
                .Include(a => a.Patient).ThenInclude(p => p.User)
                .Include(a => a.Dentist).ThenInclude(d => d.User)
                .Where(a => !a.IsDeleted)
                .ToListAsync();
        }

        public async Task<List<Appointment>> GetAllCofirmAppoitmentAsync()
        {
            return await _context.Appointments
                .Where(a => a.Status == "confirmed" && !a.IsDeleted)
                .ToListAsync();
        }

    }
}
