using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Entities;

public class FinancialTransaction
{
    [Key]
    public int TransactionID { get; set; }

    public DateTime? TransactionDate { get; set; } = default;

    [Column(TypeName = "nvarchar(500)")]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// True: Thu, False: Chi
    /// </summary>
    public bool TransactionType { get; set; }

    [Column(TypeName = "nvarchar(255)")]
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// True: tiền mặt, False: chuyển khoản (tuỳ enum bạn định nghĩa)
    /// </summary>
    public bool PaymentMethod { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }
    public string? EvidenceImage { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(255)")]
    public string status { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public int CreatedBy { get; set; }
    public int? UpdatedBy { get; set; }

    public bool IsDelete { get; set; }

}
