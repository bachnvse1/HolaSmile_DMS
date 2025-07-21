using Application.Constants;
using Application.Usecases.Assistants.DeactivePatientDentalImage;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using Xunit;


namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants
{
    public class DeactivePatientDentalImageIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly DeactivePatientDentalImageHandler _handler;

        public DeactivePatientDentalImageIntegrationTests()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(opt =>
                opt.UseInMemoryDatabase("DeactiveImageDb"));
            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            var imageRepo = new ImageRepository(_context);

            _handler = new DeactivePatientDentalImageHandler(imageRepo, _httpContextAccessor);

            SeedData();
        }

        private void SetupHttpContext(string role, int userId = 1)
        {
            var context = new DefaultHttpContext();
            context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Role, role)
            }, "TestAuth"));
            _httpContextAccessor.HttpContext = context;
        }

        private void SeedData()
        {
            _context.Images.RemoveRange(_context.Images);
            _context.SaveChanges();

            _context.Images.AddRange(
                new Image
                {
                    ImageId = 100,
                    PatientId = 10,
                    ImageURL = "https://test.com/image.jpg",
                    IsDeleted = false,
                    CreatedAt = DateTime.Now
                },
                new Image
                {
                    ImageId = 101,
                    PatientId = 10,
                    ImageURL = "https://test.com/deleted.jpg",
                    IsDeleted = true,
                    CreatedAt = DateTime.Now
                }
            );

            _context.SaveChanges();
        }

        [Fact(DisplayName = "UTCID01 - Assistant deactivates existing image")]
        public async System.Threading.Tasks.Task UTCID01_DeactivateImage_Success()
        {
            SetupHttpContext("Assistant");

            var command = new DeactivePatientDentalImageCommand { ImageId = 100 };

            var result = await _handler.Handle(command, default);

            Assert.Equal("Xoá ảnh thành công.", result);
            var img = await _context.Images.FindAsync(100);
            Assert.True(img.IsDeleted);
            Assert.NotNull(img.UpdatedAt);
            Assert.Equal(1, img.UpdatedBy);
        }

        [Fact(DisplayName = "UTCID02 - Unauthorized role throws MSG26")]
        public async System.Threading.Tasks.Task UTCID02_UnauthorizedRole_Throws()
        {
            SetupHttpContext("Receptionist");

            var command = new DeactivePatientDentalImageCommand { ImageId = 100 };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID03 - Non-existing image throws KeyNotFoundException")]
        public async System.Threading.Tasks.Task UTCID03_ImageNotFound_Throws()
        {
            SetupHttpContext("Assistant");

            var command = new DeactivePatientDentalImageCommand { ImageId = 999 };

            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Contains("Không tìm thấy ảnh", ex.Message);
        }

        [Fact(DisplayName = "UTCID04 - Already deleted image throws KeyNotFoundException")]
        public async System.Threading.Tasks.Task UTCID04_ImageAlreadyDeleted_Throws()
        {
            SetupHttpContext("Dentist");

            var command = new DeactivePatientDentalImageCommand { ImageId = 101 };

            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Contains("đã bị xoá", ex.Message);
        }
    }
}
