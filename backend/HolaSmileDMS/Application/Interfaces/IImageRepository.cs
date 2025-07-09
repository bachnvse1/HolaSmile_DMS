namespace Application.Interfaces
{
    public interface IImageRepository
    {
        Task<bool> CreateAsync(Image image);
        Task<List<Image>> GetImagesByPatientIdAsync(int patientId);
        IQueryable<Image> Query();

    }

}
