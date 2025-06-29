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
    }
}
