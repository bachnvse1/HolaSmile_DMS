namespace Application.Interfaces
{
    public interface IMaintenanceRepository
    {
        Task<bool> CreateMaintenanceAsync(EquipmentMaintenance maintenance);
        Task<bool> AddMaintenanceSupplyAsync(MaintenanceSupply supply);
        Task<List<int>> GetAllValidSupplyIdsAsync();
        Task<bool> CreateMaintenanceSupplyAsync(MaintenanceSupply maintenanceSupply);
        Task<List<EquipmentMaintenance>> GetAllMaintenancesWithSuppliesAsync();
        Task<EquipmentMaintenance?> GetMaintenanceByIdWithSuppliesAsync(int maintenanceId);
        Task<EquipmentMaintenance?> GetMaintenanceByIdAsync(int id);
        Task<bool> UpdateMaintenanceAsync(EquipmentMaintenance maintenance);
    }
}
