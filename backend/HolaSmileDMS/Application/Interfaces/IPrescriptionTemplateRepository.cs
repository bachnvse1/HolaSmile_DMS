using System.Threading;
using System.Threading.Tasks;

public interface IPrescriptionTemplateRepository
{
    Task<List<PrescriptionTemplate>> GetAllAsync(CancellationToken cancellationToken);
}
