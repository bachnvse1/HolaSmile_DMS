using System.ComponentModel.DataAnnotations;

public class EquipmentMaintenance
{
    [Key]
    public int MaintenanceId { get; set; }

    public DateTime MaintenanceDate { get; set; }

    [MaxLength(200)]
    public string? Description { get; set; }

    [MaxLength(50)]
    public string? Status { get; set; }

    public int Price { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public int? CreatedBy { get; set; }
    public int? UpdatedBy { get; set; }

    public bool IsDeleted { get; set; }

    public ICollection<MaintenanceSupply> MaintenanceSupplies { get; set; }
}
