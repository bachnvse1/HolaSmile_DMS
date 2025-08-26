namespace Application.Usecases.UserCommon.ViewProcedures;

public class ViewProcedureDto
{
    public int ProcedureId { get; set; }
    public string? ProcedureName { get; set; }
    public int Price { get; set; }
    public string? Description { get; set; }
    public decimal? Discount { get; set; }
    public int? OriginalPrice { get; set; }
    public int? ConsumableCost { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string CreatedBy { get; set; }
    public string UpdateBy { get; set; }
    public bool IsDeleted { get; set; }
    public List<ViewSuppliesUsedDto>? SuppliesUsed { get; set; }
}
