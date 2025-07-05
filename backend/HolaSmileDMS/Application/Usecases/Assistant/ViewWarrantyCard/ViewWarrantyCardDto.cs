namespace Application.Usecases.Assistant.ViewWarrantyCard
{
    public class ViewWarrantyCardDto
    {
        public int WarrantyCardId { get; set; }
        public string ProcedureName { get; set; } = null!;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? Term { get; set; }
        public bool Status { get; set; }

        // Treatment Info
        public int TreatmentRecordId { get; set; }
        public DateTime TreatmentDate { get; set; }
        public string? Symptoms { get; set; }
        public string? Diagnosis { get; set; }
        public string DentistName { get; set; } = null!;
    }
}
