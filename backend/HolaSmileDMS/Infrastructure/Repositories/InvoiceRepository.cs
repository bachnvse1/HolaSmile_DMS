using Application.Interfaces;
using AutoMapper;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class InvoiceRepository : IInvoiceRepository
{
    private readonly ApplicationDbContext _context;

    public InvoiceRepository(ApplicationDbContext context)
    {
        _context = context;
    }
    
    public async Task<List<Invoice>> GetByTreatmentRecordIdAsync(int treatmentRecordId, CancellationToken ct = default)
    {
        return await _context.Invoices
            .Where(i => i.TreatmentRecord_Id == treatmentRecordId)
            .OrderBy(i => i.PaymentDate)
            .AsNoTracking()
            .ToListAsync(ct);
    }

    public async Task<Invoice?> GetByOrderCodeAsync(string orderCode, CancellationToken cancellationToken)
    {
        return await _context.Invoices.Include(x=>x.Patient)
            .ThenInclude(x=>x.User)
            .FirstOrDefaultAsync(i => i.OrderCode == orderCode, cancellationToken);
    }

    public async System.Threading.Tasks.Task UpdateAsync(Invoice invoice, CancellationToken cancellationToken)
    {
        _context.Invoices.Update(invoice);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<Invoice>> GetFilteredInvoicesAsync(
        string? status,
        DateTime? fromDate,
        DateTime? toDate,
        int? patientId)
    {
        var query = _context.Invoices.Include(x=>x.Patient).ThenInclude(x=>x.User)
            .Where(x => !x.IsDeleted)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(x => x.Status == status);

        if (fromDate.HasValue)
            query = query.Where(x => x.CreatedAt >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(x => x.CreatedAt <= toDate.Value);

        if (patientId.HasValue)
            query = query.Where(x => x.PatientId == patientId.Value);

        return await query
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();
    }

    public async Task<Invoice?> GetInvoiceByIdAsync(int invoiceId)
    {
        return await _context.Invoices.Include(x=>x.Patient).ThenInclude(x=>x.User)
            .FirstOrDefaultAsync(x => x.InvoiceId == invoiceId && !x.IsDeleted);
    }

    public async System.Threading.Tasks.Task CreateInvoiceAsync(Invoice invoice)
    {
        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync();
    }

    public async Task<decimal> GetTotalPaidForTreatmentRecord(int treatmentRecordId)
    {
        return await _context.Invoices
            .Where(x => x.TreatmentRecord_Id == treatmentRecordId
                        && !x.IsDeleted
                        && x.Status == "paid")
            .SumAsync(x => x.PaidAmount ?? 0);
    }

    public async System.Threading.Tasks.Task UpdateInvoiceAsync(Invoice invoice)
    {
        if (invoice.IsDeleted)
        {
            throw new InvalidOperationException("Không thể cập nhật hoá đơn đã bị xoá hoặc không tồn tại.");
        }
        _context.Invoices.Update(invoice);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> HasUnpaidInvoice(int treatmentRecordId)
    {
        return await _context.Invoices.AnyAsync(i =>
            i.TreatmentRecord_Id == treatmentRecordId &&
            !i.IsDeleted &&
            i.Status != "paid"
        );
    }

    public async Task<List<Invoice>> GetTotalInvoice()
    {
        return await _context.Invoices
            .Where(i => !i.IsDeleted)
            .ToListAsync();
    }

}