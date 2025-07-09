using Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

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

    public async Task<List<Image>> GetImagesByPatientIdAsync(int patientId)
    {
        return await _context.Images
            .Where(i => i.PatientId == patientId && !i.IsDeleted)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();
    }
    public IQueryable<Image> Query()
    {
        return _context.Images.AsQueryable();
    }

}
