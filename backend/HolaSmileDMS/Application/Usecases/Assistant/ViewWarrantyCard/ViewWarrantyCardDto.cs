namespace Application.Usecases.Assistant.ViewListWarrantyCards
{
    public class ViewWarrantyCardDto
    {
        public int WarrantyCardId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? Term { get; set; }
        public bool Status { get; set; }
        public int? ProcedureId { get; set; } 
        public string ProcedureName { get; set; } = "";
    }
}
