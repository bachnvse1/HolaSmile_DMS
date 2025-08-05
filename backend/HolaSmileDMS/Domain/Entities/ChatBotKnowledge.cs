using System.ComponentModel.DataAnnotations;

namespace Domain.Entities
{
    public class ChatBotKnowledge
    {
            [Key]
            public int Id { get; set; }

            [Required]
            [MaxLength(500)]
            public string Question { get; set; }

            [Required]
            public string Answer { get; set; }

            // (Tuỳ chọn thêm category, trạng thái, v.v.)
            public string? Category { get; set; }
        }
}
