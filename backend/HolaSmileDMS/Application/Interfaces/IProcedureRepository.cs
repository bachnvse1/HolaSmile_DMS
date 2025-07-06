namespace Application.Interfaces;

public interface  IProcedureRepository
{
    IQueryable<Procedure> GetAll();
    Task<Procedure?> GetProcedureByIdAsync(int id, CancellationToken cancellationToken);
    Task<bool> UpdateProcedureAsync(Procedure procedure, CancellationToken cancellationToken);
}