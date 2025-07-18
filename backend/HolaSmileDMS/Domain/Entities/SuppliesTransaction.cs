using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Entities
{
    public class SuppliesTransaction
    {
        [ForeignKey("Supplies")]
        public int SupplyId { get; set; }
        public Supplies Supplies { get; set; }

        [ForeignKey("FinancialTransaction")]
        public int FinancialTransactionsID { get; set; }
        public FinancialTransaction FinancialTransaction { get; set; }

        public int Quantity { get; set; }
    }
}
