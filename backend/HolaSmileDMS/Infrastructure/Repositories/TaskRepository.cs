using Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class TaskRepository : ITaskRepository
    {
        private readonly ApplicationDbContext _context;

        public TaskRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> CreateTaskAsync(Task task, CancellationToken cancellationToken)
        {
            _context.Tasks.Add(task);
            var result = await _context.SaveChangesAsync(cancellationToken);
            return result > 0;
        }

        public async Task<Task?> GetTaskByIdAsync(int taskId, CancellationToken cancellationToken)
        {
            return await _context.Tasks
                .Include(t => t.TreatmentProgress)
                    .ThenInclude(tp => tp.TreatmentRecord)
                        .ThenInclude(tr => tr.Procedure)
                .Include(t => t.TreatmentProgress)
                    .ThenInclude(tp => tp.TreatmentRecord)
                        .ThenInclude(tr => tr.Dentist)
                            .ThenInclude(d => d.User)
                .FirstOrDefaultAsync(t => t.TaskID == taskId, cancellationToken);
        }
    }
}
