//using Application.Constants;
//using Application.Interfaces;
//using Application.Usecases.Receptionist.CreateFinancialTransaction;
//using Domain.Entities;
//using HDMS_API.Infrastructure.Persistence;
//using Infrastructure.Repositories;
//using MediatR;
//using Microsoft.AspNetCore.Http;
//using Microsoft.EntityFrameworkCore;
//using Microsoft.Extensions.DependencyInjection;
//using Microsoft.Extensions.Caching.Memory;
//using Moq;
//using System.Security.Claims;
//using Xunit;

//namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Receptionists
//{
//    public class CreateFinancialTransactionHandlerIntegrationTests
//    {
//        private readonly ApplicationDbContext _context;
//        private readonly ITransactionRepository _transactionRepository;
//        private readonly IOwnerRepository _ownerRepository;
//        private readonly Mock<ICloudinaryService> _cloudinaryMock;
//        private readonly Mock<IMediator> _mediatorMock;
//        private readonly IHttpContextAccessor _httpContextAccessor;

//        public CreateFinancialTransactionHandlerIntegrationTests()
//        {
//            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
//                .UseInMemoryDatabase(Guid.NewGuid().ToString())
//                .Options;

//            _context = new ApplicationDbContext(options);
//            _transactionRepository = new TransactionRepository(_context);
//            _ownerRepository = new OwnerRepository(_context);

//            _cloudinaryMock = new Mock<ICloudinaryService>();
//            _mediatorMock = new Mock<IMediator>();

//            var services = new ServiceCollection();
//            services.AddMemoryCache();
//            var provider = services.BuildServiceProvider();
//            var memoryCache = provider.GetService<IMemoryCache>();

//            _httpContextAccessor = new HttpContextAccessor();

//            SeedData();
//        }

//        private void SeedData()
//        {
//            // Users
//            _context.Users.Add(new User
//            {
//                UserID = 1,
//                Fullname = "Receptionist A",
//                Username = "recept1",
//                Phone = "0123456789"
//            });

//            _context.Users.Add(new User
//            {
//                UserID = 2,
//                Fullname = "Owner B",
//                Username = "owner1",
//                Phone = "0999999999"
//            });

//            _context.Owners.Add(new Owner
//            {
//                OwnerId = 1,
//                UserId = 2
//            });

//            _context.SaveChanges();
//        }

//        private void SetupHttpContext(string role, int userId)
//        {
//            var claims = new List<Claim>
//            {
//                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
//                new Claim(ClaimTypes.Role, role)
//            };
//            var identity = new ClaimsIdentity(claims, "TestAuth");
//            _httpContextAccessor.HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) };
//        }

//        [Fact(DisplayName = "ITCID01 - Should create transaction with image successfully")]
//        public async System.Threading.Tasks.Task ITCID01_CreateTransaction_Success()
//        {
//            // Arrange
//            SetupHttpContext("receptionist", 1);

//            var fakeFile = new FormFile(new MemoryStream(new byte[] { 1, 2, 3 }), 0, 3, "Data", "test.jpg")
//            {
//                Headers = new HeaderDictionary(),
//                ContentType = "image/jpeg"
//            };

//            var handler = new CreateFinancialTransactionHandler(
//                _transactionRepository,
//                _httpContextAccessor,
//                new Mock<IImageRepository>().Object,
//                _cloudinaryMock.Object,
//                _ownerRepository,
//                _mediatorMock.Object
//            );

//            _cloudinaryMock.Setup(x => x.UploadEvidentImageAsync(It.IsAny<IFormFile>(),"evident-images"))
//               .ReturnsAsync("https://fakecloud.com/test.jpg");

//            var command = new CreateFinancialTransactionCommand
//            {
//                TransactionType = true,
//                Description = "Test",
//                Amount = 1000,
//                Category = "Khám chữa răng",
//                PaymentMethod = true,
//                TransactionDate = DateTime.Now,
//                EvidentImage = fakeFile // ảnh hợp lệ
//            };


//            // Act
//            var result = await handler.Handle(command, default);

//            // Assert
//            Assert.True(result);
//            var transaction = _context.FinancialTransactions.FirstOrDefault();
//            Assert.NotNull(transaction);
//            Assert.Equal("Test", transaction.Description);
//            Assert.Equal("https://fakecloud.com/test.jpg", transaction.EvidenceImage);
//        }

//        [Fact(DisplayName = "ITCID02 - Should throw exception for invalid role")]
//        public async System.Threading.Tasks.Task ITCID02_InvalidRole_Throws()
//        {
//            // Arrange
//            SetupHttpContext("patient", 1);

//            var fakeFile = new FormFile(new MemoryStream(new byte[] { 1, 2 }), 0, 2, "Data", "test.jpg")
//            {
//                Headers = new HeaderDictionary(),
//                ContentType = "image/jpeg"
//            };

//            var handler = new CreateFinancialTransactionHandler(
//                _transactionRepository,
//                _httpContextAccessor,
//                new Mock<IImageRepository>().Object,
//                _cloudinaryMock.Object,
//                _ownerRepository,
//                _mediatorMock.Object
//            );

//            var command = new CreateFinancialTransactionCommand
//            {
//                TransactionType = true,
//                Description = "Test",
//                Amount = 1000,
//                Category = "Test",
//                PaymentMethod = true,
//                TransactionDate = DateTime.Now,
//                EvidentImage = fakeFile
//            };

//            // Act & Assert
//            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(command, default));
//            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
//        }

//        [Fact(DisplayName = "ITCID03 - Should throw exception for empty description")]
//        public async System.Threading.Tasks.Task ITCID03_EmptyDescription_Throws()
//        {
//            // Arrange
//            SetupHttpContext("receptionist", 1);

//            var fakeFile = new FormFile(new MemoryStream(new byte[] { 1, 2 }), 0, 2, "Data", "test.jpg")
//            {
//                Headers = new HeaderDictionary(),
//                ContentType = "image/jpeg"
//            };

//            var handler = new CreateFinancialTransactionHandler(
//                _transactionRepository,
//                _httpContextAccessor,
//                new Mock<IImageRepository>().Object,
//                _cloudinaryMock.Object,
//                _ownerRepository,
//                _mediatorMock.Object
//            );

//            var command = new CreateFinancialTransactionCommand
//            {
//                TransactionType = true,
//                Description = " ",
//                Amount = 1000,
//                Category = "Test",
//                PaymentMethod = true,
//                TransactionDate = DateTime.Now,
//                EvidentImage = fakeFile
//            };

//            // Act & Assert
//            var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, default));
//            Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
//        }

//        [Fact(DisplayName = "ITCID04 - Should throw exception for invalid image type")]
//        public async System.Threading.Tasks.Task ITCID04_InvalidImageType_Throws()
//        {
//            // Arrange
//            SetupHttpContext("receptionist", 1);

//            var fakeFile = new FormFile(new MemoryStream(new byte[] { 1, 2 }), 0, 2, "Data", "test.txt")
//            {
//                Headers = new HeaderDictionary(),
//                ContentType = "text/plain"
//            };

//            var handler = new CreateFinancialTransactionHandler(
//                _transactionRepository,
//                _httpContextAccessor,
//                new Mock<IImageRepository>().Object,
//                _cloudinaryMock.Object,
//                _ownerRepository,
//                _mediatorMock.Object
//            );

//            var command = new CreateFinancialTransactionCommand
//            {
//                TransactionType = true,
//                Description = "Test",
//                Amount = 1000,
//                Category = "Test",
//                PaymentMethod = true,
//                TransactionDate = DateTime.Now,
//                EvidentImage = fakeFile
//            };

//            // Act & Assert
//            var ex = await Assert.ThrowsAsync<ArgumentException>(() => handler.Handle(command, default));
//            Assert.Contains("jpeg/png", ex.Message);
//        }
//    }
//}
