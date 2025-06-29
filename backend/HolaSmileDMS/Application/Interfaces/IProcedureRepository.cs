namespace Application.Interfaces;

public interface  IProcedureRepository
{
    IQueryable<Procedure> GetAll();
}