using System;

namespace Application.Usecases.Receptionist.ConfigNotifyMaintenance
{
    public class ViewMaintenanceDetailsDto
    {
        public int MaintenanceId { get; set; }
        public DateTime MaintenanceDate { get; set; }
        public string? Description { get; set; }
        public string? Status { get; set; }
        public int Price { get; set; }

        public List<SupplyDto> Supplies { get; set; } = new();
    }

    public class SupplyDto
    {
        public int SupplyId { get; set; }
        public string? Name { get; set; }
        public string? Unit { get; set; }
        public decimal Price { get; set; }
        public DateTime? ExpiryDate { get; set; }
    }
}
