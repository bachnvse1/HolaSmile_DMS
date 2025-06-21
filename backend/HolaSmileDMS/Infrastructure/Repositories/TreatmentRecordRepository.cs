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
}