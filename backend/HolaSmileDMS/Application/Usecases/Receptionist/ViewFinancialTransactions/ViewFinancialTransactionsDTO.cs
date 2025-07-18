using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Application.Usecases.Receptionist.ViewFinancialTransactions
{
    public class ViewFinancialTransactionsDTO
    {
        public int TransactionID { get; set; }
        public int? InvoiceId { get; set; }
        public string TransactionDate { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        /// <summary>
        /// True: Thu, False: Chi
        /// </summary>
        public string TransactionType { get; set; }
        public string Category { get; set; } = string.Empty;

        /// <summary>
        /// True: tiền mặt, False: chuyển khoản (tuỳ enum bạn định nghĩa)
        /// </summary>
        public string PaymentMethod { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

    }
}
