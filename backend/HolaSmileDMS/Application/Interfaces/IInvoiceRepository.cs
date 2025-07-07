namespace Application.Interfaces;

public interface IInvoiceRepository
{
    Task<List<Invoice>> GetByTreatmentRecordIdAsync(int treatmentRecordId, CancellationToken ct = default);
}