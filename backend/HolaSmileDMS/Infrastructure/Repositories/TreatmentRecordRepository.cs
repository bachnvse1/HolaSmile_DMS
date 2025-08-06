﻿using Application.Interfaces;
using Application.Usecases.Patients.ViewTreatmentRecord;
using AutoMapper;
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

    public async Task<List<ViewTreatmentRecordDto>> GetPatientTreatmentRecordsAsync(int patientId, CancellationToken cancellationToken)
    {
        var records = await _context.TreatmentRecords
            .Include(tr => tr.Appointment)
            .Include(tr => tr.Dentist).ThenInclude(d => d.User)
            .Include(tr => tr.Procedure)
            .Where(tr => tr.Appointment.PatientId == patientId && !tr.IsDeleted)
            .Select(tr => new
            {
                TreatmentRecord = tr,
                // Tìm Appointment GỐC của Appointment hiện tại (nếu nó là reschedule)
                OriginalAppointmentDate = _context.Appointments
                    .Where(a => a.AppointmentId == tr.Appointment.RescheduledFromAppointmentId)
                    .Select(a => (DateTime?)a.AppointmentDate) // cast nullable
                    .FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        return records.Select(r =>
        {
            var dto = _mapper.Map<ViewTreatmentRecordDto>(r.TreatmentRecord);

            // Nếu record đang thuộc appointment mới (có RescheduledFromAppointmentId) → gán ngày gốc
            dto.AppointmentRescheduleDate = r.OriginalAppointmentDate;

            return dto;
        }).ToList();
    }

    public async Task<bool> DeleteTreatmentRecordAsync(int id, int? updatedBy, CancellationToken cancellationToken)
    {
        var record = await _context.TreatmentRecords
            .FirstOrDefaultAsync(r => r.TreatmentRecordID == id && !r.IsDeleted, cancellationToken);

        if (record == null)
            throw new KeyNotFoundException("Không tìm thấy hồ sơ điều trị để xoá.");

        record.IsDeleted = true;
        record.UpdatedAt = DateTime.Now;
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
        await _context.TreatmentRecords.AddAsync(record, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<TreatmentRecord?> GetByProcedureIdAsync(int procedureId, CancellationToken cancellationToken)
    {
        return await _context.TreatmentRecords
            .Include(tr => tr.Appointment)
            .FirstOrDefaultAsync(tr => tr.ProcedureID == procedureId && !tr.IsDeleted, cancellationToken);
    }

    public async Task<Patient?> GetPatientByPatientIdAsync(int patientId)
    {
        return await _context.Patients
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.PatientID == patientId);
    }



    public async Task<List<TreatmentRecord>> GetTreatmentRecordsByAppointmentIdAsync(int appointmentId, CancellationToken cancellationToken = default)
    {
        return await _context.TreatmentRecords
            .Where(tr => tr.AppointmentID == appointmentId && !tr.IsDeleted)
            .ToListAsync(cancellationToken);
    }
    public IQueryable<TreatmentRecord> Query()
    {
        return _context.TreatmentRecords.AsQueryable();
    }
    public async Task<TreatmentRecord?> GetTreatmentRecordById(int id, CancellationToken ct)
    {
        return await _context.TreatmentRecords
            .Include(tr => tr.Appointment)
                .ThenInclude(a => a.Patient)
                    .ThenInclude(p => p.User)
            .FirstOrDefaultAsync(tr => tr.TreatmentRecordID == id && !tr.IsDeleted, ct);
    }
}
