namespace Application.Usecases.Receptionist.ViewPromotionProgram
{
    public class ViewPromotionResponse
    {
        public int ProgramId { get; set; }
        public string ProgramName { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public DateTime CreateAt { get; set; }
        public DateTime? UpdateAt { get; set; }
        public string CreateBy { get; set; }
        public string? UpdateBy { get; set; }
        public bool IsDelete { get; set; }
        public List<ViewProcedurePromotionRespose> ListProcedure { get; set; } = new List<ViewProcedurePromotionRespose>();
    }
}

    public class ViewProcedurePromotionRespose
    {
        public int ProcedureId { get; set; }
        public string ProcedureName { get; set; }
        public decimal DiscountAmount { get; set; }
    }
