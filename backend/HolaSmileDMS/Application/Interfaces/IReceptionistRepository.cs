using Application.Usecases.Dentist.ViewListReceptionistName;

namespace Application.Interfaces;

public interface IReceptionistRepository
{
    Task<List<ReceptionistRecordDto>> GetAllReceptionistsNameAsync(CancellationToken cancellationToken);
}