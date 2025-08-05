using Application.Interfaces;
using Domain.Entities;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class ChatBotKnowledgeRepository : IChatBotKnowledgeRepository
    {
        private readonly ApplicationDbContext _context;
        public ChatBotKnowledgeRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task<List<ChatBotKnowledge>> GetAllAsync()
        {
            return await _context.ChatBotKnowledge.ToListAsync();
        }

        public async Task<bool> CreateNewKnownledgeAsync(ChatBotKnowledge knowledge)
        {
            _context.ChatBotKnowledge.Add(knowledge);
            return await _context.SaveChangesAsync() > 0;
        }
    }
}
