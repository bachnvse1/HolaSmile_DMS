public class Schedule
{
    [Key]
    public int ScheduleId { get; set; }

    [ForeignKey("Dentist")]
    public int DentistId { get; set; }
    public Dentist Dentist { get; set; }

    public DateTime WorkDate { get; set; }

    [MaxLength(20)]
    public string Shift { get; set; } // Morning, Afternoon, Evening

    public DateTime WeekStartDate { get; set; }

    [MaxLength(20)]
    public string? Status { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public int? CreatedBy { get; set; }
    public int? UpdatedBy { get; set; }
}
