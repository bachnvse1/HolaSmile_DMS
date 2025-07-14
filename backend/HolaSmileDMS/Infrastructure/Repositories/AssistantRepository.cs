using Application.Interfaces;
using Application.Usecases.Dentists.AssignTasksToAssistantHandler;
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
        public async Task<List<AssistantListDto>> GetAllAssistantsAsync()
        {
            return await _context.Assistants
                .Include(a => a.User)
                .Where(a => a.User != null && a.User.Status == true)
                .Select(a => new AssistantListDto
                {
                    AssistantId = a.AssistantId,
                    Fullname = a.User.Fullname,
                    Phone = a.User.Phone,
                })
                .ToListAsync();
        }
    }
}
