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
}