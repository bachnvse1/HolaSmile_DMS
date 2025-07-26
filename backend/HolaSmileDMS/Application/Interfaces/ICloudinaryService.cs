using Microsoft.AspNetCore.Http;

namespace Application.Interfaces
{
    public interface ICloudinaryService
    {
        Task<string> UploadImageAsync(IFormFile file, string folder = "dental-images");
        Task<string> UploadEvidentImageAsync(IFormFile file, string folder = "evident-images");

    }
}
