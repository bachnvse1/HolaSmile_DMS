namespace Application.Interfaces;

public interface IInvoiceRepository
{
    Task<List<Invoice>> GetByTreatmentRecordIdAsync(int treatmentRecordId, CancellationToken ct = default);
    Task<Invoice?> GetByOrderCodeAsync(string orderCode, CancellationToken cancellationToken);
    System.Threading.Tasks.Task UpdateAsync(Invoice invoice, CancellationToken cancellationToken);
}