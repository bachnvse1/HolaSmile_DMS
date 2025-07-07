namespace Application.Interfaces;

public interface IWarrantyCardRepository
{
    Task<WarrantyCard> GetByIdAsync(int warrantyCardId, CancellationToken ct = default);
}