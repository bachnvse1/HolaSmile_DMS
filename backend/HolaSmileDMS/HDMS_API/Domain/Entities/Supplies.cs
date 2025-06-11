public class Supplies
{
    [Key]
    public int SupplyId { get; set; }

    [MaxLength(200)]
    public string? Name { get; set; }

    public string? Unit { get; set; }

    public int QuantityInStock { get; set; }
    public DateTime? ExpiryDate { get; set; }

    public decimal Price { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public int? CreatedBy { get; set; }
    public int? UpdatedBy { get; set; }

    public bool IsDeleted { get; set; }

    public ICollection<SuppliesUsed> SuppliesUsed { get; set; }
    public ICollection<MaintenanceSupply> MaintenanceSupplies { get; set; }
}
