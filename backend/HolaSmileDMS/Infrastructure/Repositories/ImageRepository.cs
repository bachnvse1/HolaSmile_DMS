using Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;

public class ImageRepository : IImageRepository
{
    private readonly ApplicationDbContext _context;

    public ImageRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> CreateAsync(Image image)
    {
        _context.Images.Add(image);
        return await _context.SaveChangesAsync() > 0;
    }
}
