public interface IWarrantyRepository
{
    Task<List<WarrantyCard>> GetAllWarrantyCardsWithProceduresAsync(CancellationToken cancellationToken);
    Task<WarrantyCard> CreateWarrantyCardAsync(WarrantyCard card, CancellationToken cancellationToken);
}
