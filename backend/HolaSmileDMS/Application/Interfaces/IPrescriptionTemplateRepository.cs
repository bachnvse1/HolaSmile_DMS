using System.Threading;
using System.Threading.Tasks;

public interface IPrescriptionTemplateRepository
{
    Task<List<PrescriptionTemplate>> GetAllAsync(CancellationToken cancellationToken);
    Task<PrescriptionTemplate?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<bool> UpdateAsync(PrescriptionTemplate template, CancellationToken cancellationToken);
    Task<bool> CreateAsync(PrescriptionTemplate template, CancellationToken cancellationToken);

}
