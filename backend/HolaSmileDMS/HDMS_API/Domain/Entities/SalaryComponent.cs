using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class SalaryComponent
{
    [Key]
    public int SalaryComponentId { get; set; }

    [ForeignKey("Salary")]
    public int SalaryId { get; set; }
    public Salary Salary { get; set; }

    [MaxLength(50)]
    public string? ComponentType { get; set; }

    public decimal Amount { get; set; }

    public string? Type { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public int? CreatedBy { get; set; }
    public int? UpdatedBy { get; set; }

    public bool IsDeleted { get; set; }
}
