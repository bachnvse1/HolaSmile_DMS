namespace Application.Interfaces;

public interface IProcedureRepository
{
    IQueryable<Procedure> GetAll();
    Task<bool> CreateProcedure(Procedure procedure);
    Task<bool> UpdateProcedureAsync(Procedure procedure);
    Task<Procedure> GetProcedureByProcedureId(int procedureId);
    Task<Procedure?> GetByIdAsync(int id, CancellationToken ct = default);
}