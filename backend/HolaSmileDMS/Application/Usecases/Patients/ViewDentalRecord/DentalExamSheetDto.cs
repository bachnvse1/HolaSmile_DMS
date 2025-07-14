namespace Application.Usecases.Patients.ViewDentalRecord;

/// <summary>DTO tổng hợp 1 phiếu khám bệnh (một lịch hẹn).</summary>
public class DentalExamSheetDto
{
    // Header
    public int AppointmentId { get; set; }
    public string PatientName { get; set; } = default!;
    public string? BirthYear { get; set; }
    public string Phone { get; set; } = default!;
    public string Address { get; set; } = default!;
    public DateTime PrintedAt { get; set; }           // = DateTime.Now

    // Body
    public List<TreatmentRowDto> Treatments { get; set; } = new();
    public List<PaymentHistoryDto> Payments { get; set; } = new();
    public List<string> PrescriptionItems { get; set; } = new();
    public List<string> Instructions { get; set; } = new();

    // Totals (phiếu mẫu: tổng cộng – tổng chi phí – đã thanh toán – còn lại)
    public decimal GrandTotal  => Treatments.Sum(t => t.TotalAmount);
    public decimal GrandDiscount => Treatments.Sum(t => t.Discount);
    public decimal GrandCost   => Treatments.Sum(t => t.Cost);
    public decimal Paid        => Payments.Sum(p => p.Amount);
    public decimal Remaining   => GrandCost - Paid;

    // Follow-up
    public string? NextAppointmentTime { get; set; }
    public string? NextAppointmentNote { get; set; }
}