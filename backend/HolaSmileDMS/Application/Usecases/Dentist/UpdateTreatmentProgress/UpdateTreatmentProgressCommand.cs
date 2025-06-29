using MediatR;

namespace Application.Usecases.Dentist.UpdateTreatmentProgress
{
    public class UpdateTreatmentProgressCommand : IRequest<bool>
    {
        public int TreatmentProgressID { get; set; }
        public string? ProgressName { get; set; }
        public string? ProgressContent { get; set; }
        public string? Status { get; set; }
        public float? Duration { get; set; }
        public string? Description { get; set; }
        public DateTime? EndTime { get; set; }
        public string? Note { get; set; }
    }
}