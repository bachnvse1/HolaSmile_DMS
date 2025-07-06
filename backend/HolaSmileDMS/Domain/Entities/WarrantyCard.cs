using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class WarrantyCard
{
    [Key]
    public int WarrantyCardID { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    public string? Term { get; set; }

    public bool Status { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? CreateBy { get; set; }
    public int? UpdatedBy { get; set; }

    public ICollection<Procedure> Procedures { get; set; }
}
