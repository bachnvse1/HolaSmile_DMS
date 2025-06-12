using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Task
{
    [Key]
    public int TaskID { get; set; }

    [ForeignKey("Assistant")]
    public int? AssistantID { get; set; }
    public Assistant? Assistant { get; set; }

    [ForeignKey("TreatmentProgress")]
    public int? TreatmentProgressID { get; set; }
    public TreatmentProgress? TreatmentProgress { get; set; }

    [MaxLength(200)]
    public string? ProgressName { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(50)]
    public string? Status { get; set; }

    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public int? CreatedBy { get; set; }
    public int? UpdatedBy { get; set; }
}
