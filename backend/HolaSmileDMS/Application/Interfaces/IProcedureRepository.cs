namespace Application.Interfaces;

public interface  IProcedureRepository
{
    Task<List<Procedure>> GetAll();
    Task<bool> CreateProcedure(Procedure procedure);
    Task<bool> UpdateProcedureAsync(Procedure procedure);
    Task<Procedure> GetProcedureByProcedureId(int procedureId);
    Task<Procedure?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<Procedure?> GetProcedureByIdAsync(int id, CancellationToken cancellationToken);
    Task<bool> UpdateProcedureAsync(Procedure procedure, CancellationToken cancellationToken);
    Task<bool> DeleteSuppliesUsed(int procedureId);
    Task<List<SuppliesUsed>> GetSuppliesUsedByProcedureId(int procedureId);
    Task<bool> CreateSupplyUsed(List<SuppliesUsed> suppliesUsed);
}