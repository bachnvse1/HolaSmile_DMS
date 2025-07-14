using MediatR;
using System;

namespace Application.Usecases.Dentist.CreateTreatmentRecord
{
    public class CreateTreatmentRecordCommand : IRequest<string>
    {
        public int AppointmentId { get; set; }
        public int DentistId { get; set; }
        public int ProcedureId { get; set; }
        public string? ToothPosition { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal? DiscountAmount { get; set; }
        public bool? treatmentToday { get; set; }
        public float? DiscountPercentage { get; set; }
        public string? TreatmentStatus { get; set; }
        public string? Symptoms { get; set; }
        public string? Diagnosis { get; set; }
        public DateTime TreatmentDate { get; set; }
        public int? ConsultantEmployeeID { get; set; }
    }
}