namespace Domain.Entities
{
    public class SuppliesTransaction
    {
        public int SupplyId { get; set; }
        public Supplies Supplies { get; set; }

        public int FinancialTransactionsID { get; set; }
        public FinancialTransaction FinancialTransaction { get; set; }

        public int Quantity { get; set; }
    }

}
