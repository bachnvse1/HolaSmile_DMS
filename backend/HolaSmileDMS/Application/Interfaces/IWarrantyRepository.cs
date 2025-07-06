public interface IWarrantyRepository
{
    Task<List<WarrantyCard>> GetAllWarrantyCardsWithProceduresAsync(CancellationToken cancellationToken);
    Task<WarrantyCard?> GetByIdAsync(int id, CancellationToken ct);
    Task<bool> DeactiveWarrantyCardAsync(WarrantyCard card, CancellationToken ct);
    Task<List<WarrantyCard>> GetAllAsync(CancellationToken ct);
    Task<WarrantyCard> CreateWarrantyCardAsync(WarrantyCard card, CancellationToken cancellationToken);
    Task<bool> UpdateWarrantyCardAsync(WarrantyCard card, CancellationToken cancellationToken);

}
