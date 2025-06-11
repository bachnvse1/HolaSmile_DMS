using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Dentist
{
    [Key]
    public int DentistId { get; set; }

    [ForeignKey("User")]
    public int UserId { get; set; }
    public User User { get; set; }

    public ICollection<TreatmentRecord> TreatmentRecords { get; set; }
}
