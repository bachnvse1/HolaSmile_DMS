using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class SuppliesUsed
{
    [ForeignKey("Procedure")]
    public int ProcedureId { get; set; }
    public Procedure Procedure { get; set; }

    [ForeignKey("Supplies")]
    public int SupplyId { get; set; }
    public Supplies Supplies { get; set; }
}
