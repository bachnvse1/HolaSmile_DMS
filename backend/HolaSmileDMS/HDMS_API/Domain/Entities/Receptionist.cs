using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Receptionist
{
    [Key]
    public int ReceptionistId { get; set; }

    [ForeignKey("User")]
    public int UserId { get; set; }
    public User User { get; set; }
}
