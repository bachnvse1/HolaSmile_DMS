using Application.Interfaces;
using Application.Usecases.Assistants.ViewPatientDentalImage;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Moq;
using System.Security.Claims;
using Xunit;

// using Domain.Entities; // nếu entity ở namespace khác, sửa lại cho đúng

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants
{
    public class ViewPatientDentalImageHandlerTests
    {
        private readonly Mock<IImageRepository> _imageRepoMock;
        private readonly Mock<IHttpContextAccessor> _httpAccessorMock;
        private readonly ViewPatientDentalImageHandler _handler;

        public ViewPatientDentalImageHandlerTests()
        {
            _imageRepoMock = new Mock<IImageRepository>();
            _httpAccessorMock = new Mock<IHttpContextAccessor>();
            _handler = new ViewPatientDentalImageHandler(_imageRepoMock.Object, _httpAccessorMock.Object);
        }

        private void SetupHttpContext(string role = "Assistant", string userId = "1")
        {
            var ctx = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, userId),
                    new Claim(ClaimTypes.Role, role)
                }, "TestAuth"))
            };
            _httpAccessorMock.Setup(a => a.HttpContext).Returns(ctx);
        }

        // ---- Fake DbContext chỉ chứa các entity cần dùng ----
        private static FakeImageDbContext NewDb()
        {
            var options = new DbContextOptionsBuilder<FakeImageDbContext>()
                .UseInMemoryDatabase($"ImgDb_{Guid.NewGuid()}")
                .Options;
            return new FakeImageDbContext(options);
        }

        [Fact(DisplayName = "UTCID01 - Return all non-deleted images for a patient")]
        public async System.Threading.Tasks.Task UTCID01_Return_All_Images_By_Patient()
        {
            using var db = NewDb();
            db.Images.AddRange(new[]
            {
                new Image { ImageId = 1, PatientId = 1, ImageURL = "url1", IsDeleted = false, Description = "desc1", CreatedAt = DateTime.UtcNow },
                new Image { ImageId = 2, PatientId = 1, ImageURL = "url2", IsDeleted = false, Description = "desc2", CreatedAt = DateTime.UtcNow },
                new Image { ImageId = 3, PatientId = 2, ImageURL = "url3", IsDeleted = false, Description = "desc3", CreatedAt = DateTime.UtcNow },
                new Image { ImageId = 4, PatientId = 1, ImageURL = "deleted", IsDeleted = true,  Description = "desc4", CreatedAt = DateTime.UtcNow }
            });
            await db.SaveChangesAsync();

            // Trả về DbSet thực tế (IQueryable có provider async) => ToListAsync/Include hoạt động
            _imageRepoMock.Setup(r => r.Query()).Returns(db.Images);

            SetupHttpContext("Assistant");

            var command = new ViewPatientDentalImageCommand { PatientId = 1 };
            var result = await _handler.Handle(command, default);

            Assert.Equal(2, result.Count);
            Assert.All(result, r => Assert.NotNull(r.ImageURL));
        }

        [Fact(DisplayName = "UTCID02 - Filter by TreatmentRecordId")]
        public async System.Threading.Tasks.Task UTCID02_Filter_By_TreatmentRecordId()
        {
            using var db = NewDb();

            db.Images.AddRange(new[]
            {
                new Image { ImageId = 1, PatientId = 1, TreatmentRecordId = 10, IsDeleted = false, ImageURL = "1", CreatedAt = DateTime.UtcNow },
                new Image { ImageId = 2, PatientId = 1, TreatmentRecordId = 11, IsDeleted = false, ImageURL = "2", CreatedAt = DateTime.UtcNow }
            });
            await db.SaveChangesAsync();

            _imageRepoMock.Setup(r => r.Query()).Returns(db.Images);
            SetupHttpContext("Assistant");

            var command = new ViewPatientDentalImageCommand { PatientId = 1, TreatmentRecordId = 10 };
            var result = await _handler.Handle(command, default);

            Assert.Single(result);
            Assert.Equal(10, result.First().TreatmentRecordId);
        }

        [Fact(DisplayName = "UTCID03 - Filter by OrthodonticTreatmentPlanId")]
        public async System.Threading.Tasks.Task UTCID03_Filter_By_OrthodonticTreatmentPlanId()
        {
            using var db = NewDb();

            db.Images.AddRange(new[]
            {
                new Image { ImageId = 1, PatientId = 1, OrthodonticTreatmentPlanId = 20, IsDeleted = false, ImageURL = "1", CreatedAt = DateTime.UtcNow },
                new Image { ImageId = 2, PatientId = 1, OrthodonticTreatmentPlanId = 21, IsDeleted = false, ImageURL = "2", CreatedAt = DateTime.UtcNow }
            });
            await db.SaveChangesAsync();

            _imageRepoMock.Setup(r => r.Query()).Returns(db.Images);
            SetupHttpContext("Assistant");

            var command = new ViewPatientDentalImageCommand { PatientId = 1, OrthodonticTreatmentPlanId = 20 };
            var result = await _handler.Handle(command, default);

            Assert.Single(result);
            Assert.Equal(20, result.First().OrthodonticTreatmentPlanId);
        }

        [Fact(DisplayName = "UTCID04 - No match => return empty")]
        public async System.Threading.Tasks.Task UTCID04_No_Match_Return_Empty()
        {
            using var db = NewDb();
            db.Images.Add(new Image { ImageId = 1, PatientId = 99, IsDeleted = false, ImageURL = "x", CreatedAt = DateTime.UtcNow });
            await db.SaveChangesAsync();

            _imageRepoMock.Setup(r => r.Query()).Returns(db.Images);
            SetupHttpContext("Assistant");

            var command = new ViewPatientDentalImageCommand { PatientId = 1 };
            var result = await _handler.Handle(command, default);

            Assert.Empty(result);
        }

        // ---------- Fake DbContext tối thiểu ----------
        public class FakeImageDbContext : DbContext
        {
            public FakeImageDbContext(DbContextOptions<FakeImageDbContext> options) : base(options) { }

            public DbSet<Image> Images => Set<Image>();
            public DbSet<TreatmentRecord> TreatmentRecords => Set<TreatmentRecord>();
            public DbSet<Procedure> Procedures => Set<Procedure>();
            public DbSet<OrthodonticTreatmentPlan> OrthodonticTreatmentPlans => Set<OrthodonticTreatmentPlan>();

            protected override void OnModelCreating(ModelBuilder modelBuilder)
            {
                // Khóa & quan hệ TỐI THIỂU cho các entity bạn đang test
                modelBuilder.Entity<Image>().HasKey(i => i.ImageId);
                modelBuilder.Entity<TreatmentRecord>().HasKey(tr => tr.TreatmentRecordID);
                modelBuilder.Entity<Procedure>().HasKey(p => p.ProcedureId);
                modelBuilder.Entity<OrthodonticTreatmentPlan>().HasKey(o => o.PlanId);

                modelBuilder.Entity<Image>()
                    .HasOne(i => i.TreatmentRecord)
                    .WithMany()
                    .HasForeignKey(i => i.TreatmentRecordId)
                    .IsRequired(false);

                modelBuilder.Entity<Image>()
                    .HasOne(i => i.OrthodonticTreatmentPlan)
                    .WithMany()
                    .HasForeignKey(i => i.OrthodonticTreatmentPlanId)
                    .IsRequired(false);

                modelBuilder.Entity<TreatmentRecord>()
                    .HasOne(tr => tr.Procedure)
                    .WithMany()
                    .HasForeignKey(tr => tr.ProcedureID)
                    .IsRequired(false);

                // ✅ Chỉ ở TEST: bỏ qua các entity không dùng để tránh lỗi thiếu PK
                modelBuilder.Ignore<MaintenanceSupply>();
                // nếu còn lỗi tương tự, thêm tiếp các dòng dưới (tùy project bạn có type nào):
                // modelBuilder.Ignore<EquipmentMaintenance>();
                modelBuilder.Ignore<SuppliesUsed>();

                base.OnModelCreating(modelBuilder);
            }

        }
    }
}
