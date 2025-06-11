public class Patient
{
    [Key]
    public int PatientID { get; set; }

    [ForeignKey("User")]
    public int? UserID { get; set; }
    public User? User { get; set; }

    [MaxLength(255)]
    public string? PatientGroup { get; set; }

    [MaxLength(500)]
    public string? UnderlyingConditions { get; set; }

    [MaxLength(50)]
    public string? FullName { get; set; }

    public bool? Gender { get; set; }

    public int? UpdatedBy { get; set; }

    [Required, MaxLength(50)]
    public string PhoneNumber { get; set; }

    [MaxLength(200)]
    public string? Address { get; set; }

    public string? ImageUser { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public int? CreatedBy { get; set; }
}
