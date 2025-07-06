namespace Application.Interfaces;

public interface  IProcedureRepository
{
    IQueryable<Procedure> GetAll();
    Task<Procedure?> GetByIdAsync(int id, CancellationToken ct = default);
}