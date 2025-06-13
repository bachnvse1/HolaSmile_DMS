using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

public class User
{
    [Key]
    public int UserID { get; set; }

    [Required, MaxLength(50)]
    public string Username { get; set; }

    [MaxLength(50)]
    public string? Password { get; set; }

    [MaxLength(255)]
    public string? Fullname { get; set; }

    public bool? Gender { get; set; }

    [MaxLength(255)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? DOB { get; set; }

    [Required, MaxLength(100)]
    public string? Phone { get; set; }

    public bool? Status { get; set; }

    public bool? IsVerify { get; set; }

    [MaxLength(100)]
    public string? Email { get; set; }

    public string? Avatar { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public int? CreatedBy { get; set; }
    public int? UpdatedBy { get; set; }
}
