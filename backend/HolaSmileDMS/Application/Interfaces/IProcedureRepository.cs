namespace Application.Interfaces;

public interface IProcedureRepository
{
    IQueryable<Procedure> GetAll();
    Task<bool> CreateProcedure(Procedure procedure);
    Task<bool> UpdateProcedureAsync(Procedure procedure);
    Task<Procedure> GetProcedureByProcedureId(int procedureId);
    Task<Procedure?> GetProcedureByIdAsync(int id, CancellationToken cancellationToken);
    Task<bool> UpdateProcedureAsync(Procedure procedure, CancellationToken cancellationToken);
}