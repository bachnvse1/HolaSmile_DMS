using MediatR;

namespace Application.Usecases.Assistant.ProcedureTemplate.UpdateProcedure
{
    public class UpdateProcedureCommand : IRequest<bool>
    {
        public int ProcedureId { get; set; }
        public string ProcedureName { get; set; }
        public decimal Price { get; set; }
        public string Description { get; set; }
        public float Discount { get; set; }
        public string WarrantyPeriod { get; set; }
        public decimal OriginalPrice { get; set; }
        public decimal ConsumableCost { get; set; }
        public float ReferralCommissionRate { get; set; }
        public float DoctorCommissionRate { get; set; }
        public float AssistantCommissionRate { get; set; }
        public float TechnicianCommissionRate { get; set; }
    }
}
