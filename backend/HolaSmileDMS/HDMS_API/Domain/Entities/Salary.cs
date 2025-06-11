public class Salary
{
    [Key]
    public int SalaryId { get; set; }

    [ForeignKey("User")]
    public int UserId { get; set; }
    public User User { get; set; }

    public int SalaryMonth { get; set; }
    public int SalaryYear { get; set; }

    public decimal TotalSalary { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public int? CreatedBy { get; set; }
    public int? UpdatedBy { get; set; }

    public bool IsDeleted { get; set; }

    public ICollection<SalaryComponent> SalaryComponents { get; set; }
}
