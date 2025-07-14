namespace Application.Usecases.Patients.ViewDentalRecord;

public class PaymentHistoryDto
{
    public DateTime Date { get; set; }
    public decimal Amount { get; set; }
    public string Note { get; set; } = default!;
}