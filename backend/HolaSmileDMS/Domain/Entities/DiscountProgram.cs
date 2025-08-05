using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Domain.Entities
{
    public class DiscountProgram
    {
        [Key]
        public int DiscountProgramID { get; set; }

        [Column(TypeName = "nvarchar(255)")]
        public string DiscountProgramName { get; set; } = string.Empty;

        public DateTime CreateDate { get; set; }
        public DateTime EndDate { get; set; }
        public DateTime CreateAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public int CreatedBy { get; set; }
        public int? UpdatedBy { get; set; }

        public bool IsDelete { get; set; } = true;

        // Quan hệ nhiều-nhiều với Procedure
        public ICollection<ProcedureDiscountProgram> ProcedureDiscountPrograms { get; set; } = new List<ProcedureDiscountProgram>();
    }
}
