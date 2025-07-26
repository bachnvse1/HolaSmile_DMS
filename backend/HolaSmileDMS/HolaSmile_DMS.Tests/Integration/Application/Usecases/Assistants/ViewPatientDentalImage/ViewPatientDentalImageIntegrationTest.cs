using Application.Usecases.Assistants.ViewPatientDentalImage;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants
{
    public class ViewPatientDentalImageIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly ViewPatientDentalImageHandler _handler;

        public ViewPatientDentalImageIntegrationTests()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(opt =>
                opt.UseInMemoryDatabase("ViewPatientDentalImageDb"));

            // Tạo mock HttpContext
            var httpContext = new DefaultHttpContext();
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, "Assistant") 
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            httpContext.User = claimsPrincipal;

            var httpContextAccessor = new HttpContextAccessor
            {
                HttpContext = httpContext
            };

            services.AddSingleton<IHttpContextAccessor>(httpContextAccessor);

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();

            var imageRepo = new ImageRepository(_context);
            _handler = new ViewPatientDentalImageHandler(imageRepo, httpContextAccessor);

            SeedData();
        }

        private void SeedData()
        {
            _context.Images.RemoveRange(_context.Images);
            _context.TreatmentRecords.RemoveRange(_context.TreatmentRecords);
            _context.OrthodonticTreatmentPlans.RemoveRange(_context.OrthodonticTreatmentPlans);
            _context.Procedures.RemoveRange(_context.Procedures);
            _context.SaveChanges();

            _context.Procedures.Add(new Procedure
            {
                ProcedureId = 1,
                ProcedureName = "Trám răng"
            });

            _context.TreatmentRecords.Add(new TreatmentRecord
            {
                TreatmentRecordID = 10,
                ProcedureID = 1,
                AppointmentID = 100,
                DentistID = 1,
                TreatmentDate = DateTime.Today,
                Quantity = 1,
                UnitPrice = 200000,
                TotalAmount = 200000,
                CreatedAt = DateTime.UtcNow
            });

            _context.OrthodonticTreatmentPlans.Add(new OrthodonticTreatmentPlan
            {
                PlanId = 20,
                PatientId = 1,
                PlanTitle = "Chỉnh nha 1",
                TemplateName = "Template A"
            });

            _context.Images.AddRange(
                new Image
                {
                    ImageId = 1,
                    PatientId = 1,
                    TreatmentRecordId = 10,
                    ImageURL = "https://img.com/1.jpg",
                    Description = "Ảnh điều trị",
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow
                },
                new Image
                {
                    ImageId = 2,
                    PatientId = 1,
                    OrthodonticTreatmentPlanId = 20,
                    ImageURL = "https://img.com/2.jpg",
                    Description = "Ảnh chỉnh nha",
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow
                },
                new Image
                {
                    ImageId = 3,
                    PatientId = 1,
                    ImageURL = "https://img.com/deleted.jpg",
                    Description = "Đã xóa",
                    IsDeleted = true,
                    CreatedAt = DateTime.UtcNow
                }
            );

            _context.SaveChanges();
        }

        [Fact(DisplayName = "UTCID01 - Get all active images by PatientId")]
        public async System.Threading.Tasks.Task UTCID01_GetImagesByPatientId_Returns2()
        {
            var command = new ViewPatientDentalImageCommand
            {
                PatientId = 1
            };

            var result = await _handler.Handle(command, CancellationToken.None);

            Assert.Equal(2, result.Count);
            Assert.DoesNotContain(result, i => i.ImageURL == "https://img.com/deleted.jpg");
        }

        [Fact(DisplayName = "UTCID02 - Filter by TreatmentRecordId")]
        public async System.Threading.Tasks.Task UTCID02_FilterByTreatmentRecordId_Returns1()
        {
            var command = new ViewPatientDentalImageCommand
            {
                PatientId = 1,
                TreatmentRecordId = 10
            };

            var result = await _handler.Handle(command, CancellationToken.None);

            Assert.Single(result);
            Assert.Equal("Ảnh điều trị", result[0].Description);
            Assert.Equal("Trám răng", result[0].ProcedureName);
        }

        [Fact(DisplayName = "UTCID03 - Filter by OrthodonticPlanId")]
        public async System.Threading.Tasks.Task UTCID03_FilterByOrthoPlanId_Returns1()
        {
            var command = new ViewPatientDentalImageCommand
            {
                PatientId = 1,
                OrthodonticTreatmentPlanId = 20
            };

            var result = await _handler.Handle(command, CancellationToken.None);

            Assert.Single(result);
            Assert.Equal("Ảnh chỉnh nha", result[0].Description);
            Assert.Equal("Chỉnh nha 1", result[0].PlanTitle);
            Assert.Equal("Template A", result[0].TemplateName);
        }

        [Fact(DisplayName = "UTCID04 - No image found")]
        public async System.Threading.Tasks.Task UTCID04_NoImage_ReturnsEmpty()
        {
            var command = new ViewPatientDentalImageCommand
            {
                PatientId = 999
            };

            var result = await _handler.Handle(command, CancellationToken.None);

            Assert.Empty(result);
        }
    }
}
