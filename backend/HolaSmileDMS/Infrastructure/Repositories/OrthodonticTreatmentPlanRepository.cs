using Application.Interfaces;
using Application.Usecases.Patients.ViewOrthodonticTreatmentPlan;
using AutoMapper;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class OrthodonticTreatmentPlanRepository : IOrthodonticTreatmentPlanRepository
{
    private readonly IMapper _mapper;
    private readonly ApplicationDbContext _context;

    public OrthodonticTreatmentPlanRepository(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<OrthodonticTreatmentPlanDto?> GetPlanByIdAsync(int planId, int patientId, CancellationToken cancellationToken)
    {
        var plan = await _context.OrthodonticTreatmentPlans
            .Include(p => p.Patient).ThenInclude(u => u.User)
            .Include(p => p.Dentist).ThenInclude(u => u.User)
            .FirstOrDefaultAsync(p => p.PlanId == planId && p.PatientId == patientId && !p.IsDeleted, cancellationToken);

        if (plan == null)
            return null;

        var dto = _mapper.Map<OrthodonticTreatmentPlanDto>(plan);

        if (plan.CreatedBy.HasValue)
        {
            dto.CreatedByName = await _context.Users
                .Where(u => u.UserID == plan.CreatedBy)
                .Select(u => u.Fullname)
                .FirstOrDefaultAsync(cancellationToken);
        }

        if (plan.UpdatedBy.HasValue)
        {
            dto.UpdatedByName = await _context.Users
                .Where(u => u.UserID == plan.UpdatedBy)
                .Select(u => u.Fullname)
                .FirstOrDefaultAsync(cancellationToken);
        }

        return dto;
    }

    public Task<OrthodonticTreatmentPlan?> GetPlanByPlanIdAsync(int planId, CancellationToken cancellationToken)
    {
        return _context.OrthodonticTreatmentPlans.FirstOrDefaultAsync(x=> x.PlanId == planId, cancellationToken);
    }

    public async System.Threading.Tasks.Task AddAsync(OrthodonticTreatmentPlan plan, CancellationToken cancellationToken)
    {
        await _context.OrthodonticTreatmentPlans.AddAsync(plan, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async System.Threading.Tasks.Task UpdateAsync(OrthodonticTreatmentPlan plan)
    {
        _context.OrthodonticTreatmentPlans.Update(plan);
        await _context.SaveChangesAsync();
    }

    public async Task<List<OrthodonticTreatmentPlan>> GetAllByPatientIdAsync(int patientId, CancellationToken cancellationToken)
    {
        return await _context.OrthodonticTreatmentPlans
            .Where(p => p.PatientId == patientId && !p.IsDeleted)
            .Include(p => p.Patient).ThenInclude(u => u.User)
            .Include(p => p.Dentist).ThenInclude(u => u.User)
            .ToListAsync(cancellationToken);
    }
}