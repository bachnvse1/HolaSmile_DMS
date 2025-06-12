using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Assistant
{
    [Key]
    public int AssistantId { get; set; }

    [ForeignKey("User")]
    public int UserId { get; set; }
    public User User { get; set; }

    public ICollection<Task> Tasks { get; set; }
}
