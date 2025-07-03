namespace Application.Interfaces;

public interface  IProcedureRepository
{
    IQueryable<Procedure> GetAll();
    Task<bool> CreateProcedure(Procedure procedure);
}