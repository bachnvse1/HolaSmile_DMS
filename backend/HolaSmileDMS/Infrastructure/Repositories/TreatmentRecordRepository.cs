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
        var patientId = _context.Patients.Where(x=>x.UserID == userId).FirstOrDefault().PatientID;
        return await _context.TreatmentRecords
            .Where(tr => tr.Appointment.PatientId == patientId && !tr.IsDeleted)
            .ProjectTo<ViewTreatmentRecordDto>(_mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);
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


}