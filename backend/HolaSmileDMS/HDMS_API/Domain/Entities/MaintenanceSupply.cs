public class MaintenanceSupply
{
    [Key]
    public int MaintenanceSupplyId { get; set; }

    [ForeignKey("Supplies")]
    public int SupplyId { get; set; }

    [ForeignKey("EquipmentMaintenance")]
    public int MaintenanceId { get; set; }

    public Supplies Supplies { get; set; }
    public EquipmentMaintenance EquipmentMaintenance { get; set; }
}
