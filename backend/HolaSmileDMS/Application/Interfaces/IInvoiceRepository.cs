namespace Application.Interfaces;

public interface IInvoiceRepository
{
    Task<List<Invoice>> GetByTreatmentRecordIdAsync(int treatmentRecordId, CancellationToken ct = default);
    Task<Invoice?> GetByOrderCodeAsync(string orderCode, CancellationToken cancellationToken);
    System.Threading.Tasks.Task UpdateAsync(Invoice invoice, CancellationToken cancellationToken);
    Task<List<Invoice>> GetFilteredInvoicesAsync(
        string? status,
        DateTime? fromDate,
        DateTime? toDate,
        int? patientId
    );
    Task<Invoice?> GetInvoiceByIdAsync(int invoiceId);
    System.Threading.Tasks.Task CreateInvoiceAsync(Invoice invoice);
    Task<decimal> GetTotalPaidForTreatmentRecord(int treatmentRecordId);
    System.Threading.Tasks.Task UpdateInvoiceAsync(Invoice invoice);
    Task<bool> HasUnpaidInvoice(int treatmentRecordId);
    Task<List<Invoice>> GetTotalInvoice();
    Task<Invoice> GetLastestInvoice();
}