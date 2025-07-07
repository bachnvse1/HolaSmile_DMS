using Application.Interfaces;
using Application.Usecases.Assistant.ViewAssignedTasks;
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

        public async Task<List<AssignedTaskDto>> GetTasksByAssistantIdAsync(
    int assistantId,
    CancellationToken cancellationToken)
        {
            // Lấy luôn toàn bộ chuỗi quan hệ cần thiết, tránh N+1
            return await _context.Tasks
                .Where(t => t.AssistantID == assistantId)
                .Include(t => t.TreatmentProgress!)
                    .ThenInclude(tp => tp.TreatmentRecord!)
                        .ThenInclude(tr => tr.Procedure)
                .Include(t => t.TreatmentProgress!)
                    .ThenInclude(tp => tp.TreatmentRecord!)
                        .ThenInclude(tr => tr.Dentist)
                            .ThenInclude(d => d.User)
                .Select(t => new AssignedTaskDto
                {
                    // Task
                    TaskId = t.TaskID,
                    ProgressName = t.ProgressName,
                    Description = t.Description,
                    Status = t.Status == true ? "Completed"
                                 : t.Status == false ? "Pending"
                                 : "Unknown",
                    StartTime = t.StartTime.HasValue
                                 ? t.StartTime.Value.ToString(@"hh\:mm")
                                 : null,
                    EndTime = t.EndTime.HasValue
                                 ? t.EndTime.Value.ToString(@"hh\:mm")
                                 : null,

                    // Treatment Progress (có thể null nếu Task chưa gán Progress)
                    TreatmentProgressId = t.TreatmentProgressID ?? 0,
                    TreatmentDate = t.TreatmentProgress!.TreatmentRecord.TreatmentDate,
                    Symptoms = t.TreatmentProgress!.TreatmentRecord.Symptoms,
                    Diagnosis = t.TreatmentProgress!.TreatmentRecord.Diagnosis,

                    // Treatment Record
                    TreatmentRecordId = t.TreatmentProgress!.TreatmentRecordID,
                    ProcedureName = t.TreatmentProgress!.TreatmentRecord!.Procedure.ProcedureName,
                    DentistName = t.TreatmentProgress!.TreatmentRecord!.Dentist.User.Fullname
                })
                .AsNoTracking()
                .ToListAsync(cancellationToken);
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

        public async Task<bool> UpdateTaskAsync(Task task, CancellationToken cancellationToken)
        {
            _context.Tasks.Update(task);
            return await _context.SaveChangesAsync(cancellationToken) > 0;
        }

        public async Task<TreatmentProgress?> GetTreatmentProgressByIdAsync(int treatmentProgressId, CancellationToken cancellationToken)
        {
            return await _context.TreatmentProgresses
                .FirstOrDefaultAsync(tp => tp.TreatmentProgressID == treatmentProgressId, cancellationToken);
        }
    }
}
