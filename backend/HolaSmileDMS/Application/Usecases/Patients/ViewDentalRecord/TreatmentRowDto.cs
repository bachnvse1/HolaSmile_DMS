namespace Application.Usecases.Patients.ViewDentalRecord;

/// <summary>Chi tiết 1 dòng thủ thuật điều trị.</summary>
public class TreatmentRowDto
{
    public DateTime TreatmentDate { get; set; }
    public string ProcedureName { get; set; } = default!;
    public string Symptoms { get; set; } = default!;
    public string Diagnosis { get; set; } = default!;
    public string DentistName { get; set; } = default!;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Discount { get; set; }
    public decimal TotalAmount { get; set; }          // = UnitPrice * Quantity
    public decimal Cost => TotalAmount - Discount;    // Thành tiền thực trả
    public string? WarrantyTerm { get; set; }
}