using Application.Interfaces;

namespace Infrastructure.Services
{
    public class FileStorageService : IFileStorageService
    {
        public string SaveAvatar(string sourcePath)
        {
            if (string.IsNullOrWhiteSpace(sourcePath) || !File.Exists(sourcePath))
                throw new FileNotFoundException("Ảnh không tồn tại");

            var extension = Path.GetExtension(sourcePath);
            var newFileName = $"avatar_{Guid.NewGuid()}{extension}";
            var avatarFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "avatar");

            if (!Directory.Exists(avatarFolder))
                Directory.CreateDirectory(avatarFolder);

            var newFilePath = Path.Combine(avatarFolder, newFileName);
            File.Copy(sourcePath, newFilePath, true);

            return $"/avatar/{newFileName}";
        }
    }
}
