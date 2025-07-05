namespace Application.Interfaces
{
    public interface IWarrantyRepository
    {
        Task<WarrantyCard?> GetWarrantyCardByPatientIdAsync(int patientId, CancellationToken cancellationToken);
    }

}
