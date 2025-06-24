using MediatR;
using System.Text.Json.Serialization;

namespace Application.Usecases.Dentist.UpdateTreatmentRecord
{
    public class UpdateTreatmentRecordCommand : IRequest<bool>
    {
        public string? ToothPosition { get; set; }
        public int? Quantity { get; set; }
        public decimal? UnitPrice { get; set; }
        public float? DiscountPercentage { get; set; }
        public decimal? DiscountAmount { get; set; }
        public decimal? TotalAmount { get; set; }
        public string? TreatmentStatus { get; set; }
        public string? Symptoms { get; set; }
        public string? Diagnosis { get; set; }
        public DateTime? TreatmentDate { get; set; }
        public int? UpdatedBy { get; set; }

        // Cần thiết cho Handler để biết cập nhật bản ghi nào.
        [JsonIgnore]
        public int TreatmentRecordId { get; set; }
    }
}
