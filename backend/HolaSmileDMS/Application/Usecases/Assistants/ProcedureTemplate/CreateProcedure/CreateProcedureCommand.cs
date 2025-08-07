using MediatR;

namespace Application.Usecases.Assistant.ProcedureTemplate.CreateProcedure
{
    public class CreateProcedureCommand : IRequest<bool>
    {
        public string ProcedureName { get; set; }
        public string Description { get; set; }
        public float Discount { get; set; }
        public decimal OriginalPrice { get; set; }
        public decimal ConsumableCost { get; set; }
        public float ReferralCommissionRate { get; set; }
        public float DoctorCommissionRate { get; set; }
        public float AssistantCommissionRate { get; set; }
        public float TechnicianCommissionRate { get; set; }
        public List<SupplyUsedDTO> SuppliesUsed { get; set; }
    }
}
