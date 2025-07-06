public interface IWarrantyRepository
{
    Task<List<WarrantyCard>> GetAllWarrantyCardsWithProceduresAsync(CancellationToken cancellationToken);
}
