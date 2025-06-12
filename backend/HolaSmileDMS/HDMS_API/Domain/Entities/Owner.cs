using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Owner
{
    [Key]
    public int OwnerId { get; set; }

    [ForeignKey("User")]
    public int UserId { get; set; }
    public User User { get; set; }
}
