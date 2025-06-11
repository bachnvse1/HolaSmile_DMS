using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class SuppliesUsed
{
    [Key]
    public int Id { get; set; } // Optional: You can use composite key instead

    [ForeignKey("Procedure")]
    public int ProcedureId { get; set; }
    public Procedure Procedure { get; set; }

    [ForeignKey("Supplies")]
    public int SupplyId { get; set; }
    public Supplies Supplies { get; set; }
}
