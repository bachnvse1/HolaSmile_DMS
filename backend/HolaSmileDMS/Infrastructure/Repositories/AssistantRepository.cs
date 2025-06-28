using Application.Interfaces;
using Application.Usecases.Assistant.ViewAssignedTasks;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class AssistantRepository : IAssistantRepository
    {
        private readonly ApplicationDbContext _context;

        public AssistantRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<AssignedTaskDto>> GetTasksByAssistantIdAsync(int assistantId, CancellationToken cancellationToken)
        {
            return await _context.Tasks
                .Where(t => t.AssistantID == assistantId)
                .Select(t => new AssignedTaskDto
                {
                    TaskId = t.TaskID,
                    ProgressName = t.ProgressName,
                    Description = t.Description,
                    Status = t.Status == true ? "Completed" : "Pending",
                    StartTime = t.StartTime.ToString(),
                    EndTime = t.EndTime.ToString()
                })
                .ToListAsync(cancellationToken);
        }
    }
}
