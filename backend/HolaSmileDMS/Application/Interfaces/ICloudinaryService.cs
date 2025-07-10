using Microsoft.AspNetCore.Http;

namespace Application.Interfaces
{
    public interface ICloudinaryService
    {
        Task<string> UploadImageAsync(IFormFile file, string folder = "dental-images");
    }
}
