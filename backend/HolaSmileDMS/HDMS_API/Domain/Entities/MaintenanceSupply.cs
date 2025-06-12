using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class MaintenanceSupply
{
    [ForeignKey("Supplies")]
    public int SupplyId { get; set; }

    [ForeignKey("EquipmentMaintenance")]
    public int MaintenanceId { get; set; }

    public Supplies Supplies { get; set; }
    public EquipmentMaintenance EquipmentMaintenance { get; set; }
}
