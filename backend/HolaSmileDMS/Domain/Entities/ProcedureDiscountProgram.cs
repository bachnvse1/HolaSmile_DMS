using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Entities
{
    public class ProcedureDiscountProgram
    {
        // Khóa ngoại đến Procedure
        public int ProcedureId { get; set; }
        public Procedure Procedure { get; set; }

        // Khóa ngoại đến DiscountProgram
        public int DiscountProgramId { get; set; }
        public DiscountProgram DiscountProgram { get; set; }

        // Số tiền giảm giá áp dụng cho thủ thuật
        [Column(TypeName = "decimal(18,2)")]
        public decimal DiscountAmount { get; set; }
    }

}
