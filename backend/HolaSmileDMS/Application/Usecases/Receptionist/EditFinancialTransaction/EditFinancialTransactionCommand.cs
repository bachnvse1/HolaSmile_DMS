
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Receptionist.EditFinancialTransaction
{
    public class EditFinancialTransactionCommand : IRequest<bool>
    {
        public int TransactionId { get; set; } // ID of the transaction to be edited
        public bool TransactionType { get; set; } // true for thu, false for chi
        public string Description { get; set; }
        public decimal Amount { get; set; }
        public string? Category { get; set; }
        public bool PaymentMethod { get; set; } //true for tien mat, false for chuyen khoan
        public DateTime TransactionDate { get; set; }
        public IFormFile EvidenceImage { get; set; } // Assuming you are using IFormFile for file uploads

    }
}
