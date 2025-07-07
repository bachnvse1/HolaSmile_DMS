namespace Application.Usecases.Assistant.CreateWarrantyCard
{
    public class CreateWarrantyCardDto
    {
        public int WarrantyCardId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? Term { get; set; }
        public bool Status { get; set; }
    }
}
