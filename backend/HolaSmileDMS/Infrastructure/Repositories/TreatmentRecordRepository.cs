using Application.Interfaces;
using Application.Usecases.Patients.ViewTreatmentRecord;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class TreatmentRecordRepository : ITreatmentRecordRepository
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public TreatmentRecordRepository(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<ViewTreatmentRecordDto>> GetPatientTreatmentRecordsAsync(int userId, CancellationToken cancellationToken)
    {
        var patient = _context.Patients.Where(x=>x.UserID == userId).FirstOrDefault();
        if (patient == null)
            return new List<ViewTreatmentRecordDto>();
        
        return await _context.TreatmentRecords
            .Where(tr => tr.Appointment.PatientId == patient.PatientID && !tr.IsDeleted)
            .ProjectTo<ViewTreatmentRecordDto>(_mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> DeleteTreatmentRecordAsync(int id, int? updatedBy, CancellationToken cancellationToken)
    {
        var record = await _context.TreatmentRecords
            .FirstOrDefaultAsync(r => r.TreatmentRecordID == id && !r.IsDeleted, cancellationToken);

        if (record == null)
            throw new KeyNotFoundException("Không tìm thấy hồ sơ điều trị để xoá.");

        record.IsDeleted = true;
        record.UpdatedAt = DateTime.UtcNow;
        record.UpdatedBy = updatedBy ?? 0;

        return await _context.SaveChangesAsync(cancellationToken) > 0;
    }

    public async Task<TreatmentRecord?> GetTreatmentRecordByIdAsync(int id, CancellationToken cancellationToken)
    {
        return await _context.TreatmentRecords
            .FirstOrDefaultAsync(x => x.TreatmentRecordID == id && !x.IsDeleted, cancellationToken);
    }

    public async Task<bool> UpdatedTreatmentRecordAsync(TreatmentRecord record, CancellationToken cancellationToken)
    {
        _context.TreatmentRecords.Update(record);
        return await _context.SaveChangesAsync(cancellationToken) > 0;
    }

    public async System.Threading.Tasks.Task AddAsync(TreatmentRecord record, CancellationToken cancellationToken)
    {
        _context.TreatmentRecords.AddAsync(record, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }
}