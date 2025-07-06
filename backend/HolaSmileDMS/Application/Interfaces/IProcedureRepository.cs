namespace Application.Interfaces;

public interface  IProcedureRepository
{
    Task<List<Procedure>> GetAll();
    Task<bool> CreateProcedure(Procedure procedure);
    Task<bool> UpdateProcedureAsync(Procedure procedure);
    Task<Procedure> GetProcedureByProcedureId(int procedureId);
}