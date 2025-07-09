namespace Application.Interfaces
{
    public interface IImageRepository
    {
        Task<bool> CreateAsync(Image image);
    }

}
