
using Application.Usecases.Guests.AskChatBot;

namespace Application.Usecases.UserCommon.ChatbotUserData
{
    public sealed class PatientData
    {
        public string? Scope { get; set; }
        public List<AppointmentData> Appointments { get; set; } = new();
        public List<InvoiceData> Invoices { get; set; }
    }

    public sealed class InvoiceData
    {
        public string OrderCode { get; set; }
        public string PatientName { get; set; }
        public decimal? TotalAmount { get; set; }
        public decimal? AmountPaid { get; set; }
        public decimal? AmountRemain { get; set; }
        public string? TransactionType { get; set; }
        public string? PaymenMethod { get; set; }
        public string? TransactionDate { get; set; }



    }
}
