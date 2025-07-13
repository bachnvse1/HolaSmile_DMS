//using Application.Interfaces;
//using Application.Usecases.Assistants.ViewPatientDentalImage;
//using Microsoft.EntityFrameworkCore;
//using Moq;
//using Xunit;

//namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants
//{
//    public class ViewPatientDentalImageHandlerTests
//    {
//        private readonly Mock<IImageRepository> _imageRepoMock;
//        private readonly ViewPatientDentalImageHandler _handler;
//        private readonly DbContextOptions<FakeDbContext> _dbOptions;

//        public ViewPatientDentalImageHandlerTests()
//        {
//            _imageRepoMock = new Mock<IImageRepository>();
//            _handler = new ViewPatientDentalImageHandler(_imageRepoMock.Object);

//            _dbOptions = new DbContextOptionsBuilder<FakeDbContext>()
//                .UseInMemoryDatabase(Guid.NewGuid().ToString())
//                .Options;
//        }

//        private void SeedData(FakeDbContext context)
//        {
//            var images = new List<Image>
//            {
//                new Image { ImageId = 1, PatientId = 1, ImageURL = "url1", IsDeleted = false, Description = "desc1", CreatedAt = DateTime.UtcNow },
//                new Image { ImageId = 2, PatientId = 1, ImageURL = "url2", IsDeleted = false, Description = "desc2", CreatedAt = DateTime.UtcNow },
//                new Image { ImageId = 3, PatientId = 2, ImageURL = "url3", IsDeleted = false, Description = "desc3", CreatedAt = DateTime.UtcNow },
//                new Image { ImageId = 4, PatientId = 1, ImageURL = "deleted", IsDeleted = true, Description = "desc4", CreatedAt = DateTime.UtcNow }
//            };

//            context.Images.AddRange(images);
//            context.SaveChanges();
//        }

//        [Fact(DisplayName = "UTCID01 - Return all non-deleted images for a patient")]
//        public async System.Threading.Tasks.Task UTCID01_Return_All_Images_By_Patient()
//        {
//            using var context = new FakeDbContext(_dbOptions);
//            SeedData(context);

//            _imageRepoMock.Setup(r => r.Query()).Returns(context.Images);

//            var command = new ViewPatientDentalImageCommand { PatientId = 1 };

//            var result = await _handler.Handle(command, default);

//            Assert.Equal(2, result.Count);
//            Assert.All(result, r => Assert.NotNull(r.ImageURL));
//        }

//        [Fact(DisplayName = "UTCID02 - Filter by TreatmentRecordId")]
//        public async System.Threading.Tasks.Task UTCID02_Filter_By_TreatmentRecordId()
//        {
//            using var context = new FakeDbContext(_dbOptions);

//            var images = new List<Image>
//            {
//                new Image { ImageId = 1, PatientId = 1, TreatmentRecordId = 10, IsDeleted = false, ImageURL = "1", CreatedAt = DateTime.UtcNow },
//                new Image { ImageId = 2, PatientId = 1, TreatmentRecordId = 11, IsDeleted = false, ImageURL = "2", CreatedAt = DateTime.UtcNow }
//            };
//            context.Images.AddRange(images);
//            context.SaveChanges();

//            _imageRepoMock.Setup(r => r.Query()).Returns(context.Images);

//            var command = new ViewPatientDentalImageCommand { PatientId = 1, TreatmentRecordId = 10 };

//            var result = await _handler.Handle(command, default);

//            Assert.Single(result);
//            Assert.Equal(10, result.First().TreatmentRecordId);
//        }

//        [Fact(DisplayName = "UTCID03 - Filter by OrthodonticTreatmentPlanId")]
//        public async System.Threading.Tasks.Task UTCID03_Filter_By_OrthodonticTreatmentPlanId()
//        {
//            using var context = new FakeDbContext(_dbOptions);

//            var images = new List<Image>
//            {
//                new Image { ImageId = 1, PatientId = 1, OrthodonticTreatmentPlanId = 20, IsDeleted = false, ImageURL = "1", CreatedAt = DateTime.UtcNow },
//                new Image { ImageId = 2, PatientId = 1, OrthodonticTreatmentPlanId = 21, IsDeleted = false, ImageURL = "2", CreatedAt = DateTime.UtcNow }
//            };
//            context.Images.AddRange(images);
//            context.SaveChanges();

//            _imageRepoMock.Setup(r => r.Query()).Returns(context.Images);

//            var command = new ViewPatientDentalImageCommand { PatientId = 1, OrthodonticTreatmentPlanId = 20 };

//            var result = await _handler.Handle(command, default);

//            Assert.Single(result);
//            Assert.Equal(20, result.First().OrthodonticTreatmentPlanId);
//        }

//        [Fact(DisplayName = "UTCID04 - No match => return empty")]
//        public async System.Threading.Tasks.Task UTCID04_No_Match_Return_Empty()
//        {
//            using var context = new FakeDbContext(_dbOptions);

//            context.Images.Add(new Image { ImageId = 1, PatientId = 99, IsDeleted = false, CreatedAt = DateTime.UtcNow });
//            context.SaveChanges();

//            _imageRepoMock.Setup(r => r.Query()).Returns(context.Images);

//            var command = new ViewPatientDentalImageCommand { PatientId = 1 };

//            var result = await _handler.Handle(command, default);

//            Assert.Empty(result);
//        }

//        public class FakeDbContext : DbContext
//        {
//            public FakeDbContext(DbContextOptions<FakeDbContext> options) : base(options) { }

//            public DbSet<Image> Images => Set<Image>();

//            protected override void OnModelCreating(ModelBuilder modelBuilder)
//            {
//                // Không include các entity khác, chỉ define Images
//                modelBuilder.Entity<Image>().HasKey(i => i.ImageId);
//                base.OnModelCreating(modelBuilder);
//            }
//        }

//    }
//}
