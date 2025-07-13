namespace Application.Usecases.UserCommon.ViewProcedures;

public class ViewProcedureDto
{
    public int ProcedureId { get; set; }
    public string? ProcedureName { get; set; }
    public decimal Price { get; set; }
    public string? Description { get; set; }
    public float? Discount { get; set; }
    public string? WarrantyPeriod { get; set; }
    public decimal? OriginalPrice { get; set; }
    public decimal? ConsumableCost { get; set; }
    public float? ReferralCommissionRate { get; set; }
    public float? DoctorCommissionRate { get; set; }
    public float? AssistantCommissionRate { get; set; }
    public float? TechnicianCommissionRate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string CreatedBy { get; set; }
    public string UpdateBy { get; set; }
    public bool IsDeleted { get; set; }
    public List<ViewSuppliesUsedDto>? SuppliesUsed { get; set; }
}
