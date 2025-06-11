public class SMS
{
    [Key]
    public int SMSId { get; set; }

    [ForeignKey("Patient")]
    public int? Patient_Id { get; set; }
    public Patient? Patient { get; set; }

    [ForeignKey("SMSTemplate")]
    public int? SMSTemplateId { get; set; }
    public SMSTemplate? SMSTemplate { get; set; }

    public string? SMSContent { get; set; }

    public int? CreatedBy { get; set; }
    public int? UpdateBy { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }

    [MaxLength(255)]
    public string? Purpose { get; set; }
}
