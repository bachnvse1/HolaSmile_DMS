namespace Application.Usecases.Receptionist.ConfigNotifyMaintenance
{
    public class ViewMaintenanceDto
    {
        public int MaintenanceId { get; set; }
        public DateTime MaintenanceDate { get; set; }
        public string? Description { get; set; }
        public string? Status { get; set; }
        public int? Price { get; set; }

        public List<string> Supplies { get; set; } = new();
    }
}
