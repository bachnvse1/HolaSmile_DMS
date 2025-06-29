using MediatR;

namespace Application.Usecases.Dentist.AssignTasksToAssistantHandler
{
    public class AssignTaskToAssistantCommand : IRequest<string>
    {
        public int AssistantId { get; set; }
        public int TreatmentProgressId { get; set; }
        public string ProgressName { get; set; } = null!;
        public string Description { get; set; } = null!;
        public bool Status { get; set; }
        public string StartTime { get; set; } = null!; 
        public string EndTime { get; set; } = null!;    
    }
}
