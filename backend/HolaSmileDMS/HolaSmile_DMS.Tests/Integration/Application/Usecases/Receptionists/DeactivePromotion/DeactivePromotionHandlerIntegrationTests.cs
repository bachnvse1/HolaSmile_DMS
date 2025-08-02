using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Receptionist.De_ActivePromotion;
using Domain.Entities;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Receptionists
{
    public class DeactivePromotionHandlerIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly IPromotionRepository _promotionRepository;
        private readonly IProcedureRepository _procedureRepository;
        private readonly IOwnerRepository _ownerRepository;
        private readonly Mock<IMediator> _mediatorMock;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public DeactivePromotionHandlerIntegrationTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _promotionRepository = new PromotionRepository(_context);
            _procedureRepository = new ProcedureRepository(_context);
            _ownerRepository = new OwnerRepository(_context);
            _mediatorMock = new Mock<IMediator>();

            // Setup memory cache (if needed by repository)
            var services = new ServiceCollection();
            services.AddMemoryCache();
            var serviceProvider = services.BuildServiceProvider();
            var memoryCache = serviceProvider.GetService<IMemoryCache>();

            _httpContextAccessor = new HttpContextAccessor();

            SeedData();
        }

        private void SeedData()
        {
            // Users
            _context.Users.Add(new User
            {
                UserID = 1,
                Username = "recept",
                Fullname = "Receptionist A",
                Phone = "0123456789"
            });

            _context.Users.Add(new User
            {
                UserID = 2,
                Username = "owner",
                Fullname = "Owner B",
                Phone = "0999999999"
            });

            // Owner
            _context.Owners.Add(new Owner
            {
                OwnerId = 1,
                UserId = 2
            });

            // Procedures
            _context.Procedures.AddRange(
                new Procedure
                {
                    ProcedureId = 101,
                    ProcedureName = "Tẩy trắng",
                    Price = 1000
                },
                new Procedure
                {
                    ProcedureId = 102,
                    ProcedureName = "Nhổ răng",
                    Price = 2000
                }
            );

            // Promotion
            var promotion = new DiscountProgram
            {
                DiscountProgramID = 1,
                DiscountProgramName = "Khuyến mãi hè",
                CreateDate = DateTime.Now,
                EndDate = DateTime.Now.AddDays(5),
                IsDelete = true, // DeActive
                ProcedureDiscountPrograms = new List<ProcedureDiscountProgram>
                {
                    new ProcedureDiscountProgram { ProcedureId = 101, DiscountAmount = 10 },
                    new ProcedureDiscountProgram { ProcedureId = 102, DiscountAmount = 20 }
                }
            };
            _context.DiscountPrograms.Add(promotion);

            _context.SaveChanges();
        }

        private void SetupHttpContext(string role, int userId)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Role, role),
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            _httpContextAccessor.HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) };
        }

        [Fact(DisplayName = "ITCID01 - Should deactivate active promotion successfully")]
        public async System.Threading.Tasks.Task ITCID01_DeactivatePromotion_Success()
        {
            _context.DiscountPrograms.Add(new DiscountProgram
            {
                DiscountProgramID = 5,
                DiscountProgramName = "Khuyến mãi khác",
                CreateDate = DateTime.Now,
                EndDate = DateTime.Now.AddDays(3),
                IsDelete = false
            });
            _context.SaveChanges();
            // Arrange
            SetupHttpContext("receptionist", 1);
            var handler = new DeactivePromotionHandler(_httpContextAccessor, _promotionRepository, _procedureRepository, _ownerRepository, _mediatorMock.Object);

            var command = new DeactivePromotionCommand(5);

            // Act
            var result = await handler.Handle(command, default);

            // Assert
            Assert.True(result);

            var updatedPromotion = await _promotionRepository.GetDiscountProgramByIdAsync(1);
            Assert.True(updatedPromotion.IsDelete);
        }

        [Fact(DisplayName = "ITCID02 - Should throw if promotion not found")]
        public async System.Threading.Tasks.Task ITCID02_PromotionNotFound_Throws()
        {
            // Arrange
            SetupHttpContext("receptionist", 1);
            var handler = new DeactivePromotionHandler(_httpContextAccessor, _promotionRepository, _procedureRepository, _ownerRepository, _mediatorMock.Object);

            var command = new DeactivePromotionCommand(999);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG119, ex.Message);
        }

        [Fact(DisplayName = "ITCID03 - Should throw if user not receptionist")]
        public async System.Threading.Tasks.Task ITCID03_InvalidRole_Throws()
        {
            // Arrange
            SetupHttpContext("patient", 1);
            var handler = new DeactivePromotionHandler(_httpContextAccessor, _promotionRepository, _procedureRepository, _ownerRepository, _mediatorMock.Object);

            var command = new DeactivePromotionCommand(1);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "ITCID04 - Should activate inactive promotion successfully")]
        public async System.Threading.Tasks.Task ITCID04_ActivatePromotion_Success()
        {
            // Arrange
            // Toggle promotion to inactive first
            //_context.DiscountPrograms.Add(new DiscountProgram
            //{
            //    DiscountProgramID = 2,
            //    DiscountProgramName = "Khuyến mãi khác",
            //    CreateDate = DateTime.Now,
            //    EndDate = DateTime.Now.AddDays(3),
            //    IsDelete = true
            //});
            //_context.SaveChanges();
            var promo = await _promotionRepository.GetDiscountProgramByIdAsync(1);
            promo.IsDelete = true;
            await _promotionRepository.UpdateDiscountProgramAsync(promo);

            SetupHttpContext("receptionist", 1);
            var handler = new DeactivePromotionHandler(_httpContextAccessor, _promotionRepository, _procedureRepository, _ownerRepository, _mediatorMock.Object);

            var command = new DeactivePromotionCommand(1);

            // Act
            var result = await handler.Handle(command, default);

            // Assert
            Assert.True(result);

            var updatedPromotion = await _promotionRepository.GetDiscountProgramByIdAsync(1);
            Assert.False(updatedPromotion.IsDelete);
        }

        [Fact(DisplayName = "ITCID05 - Should throw if multiple active promotions exist")]
        public async System.Threading.Tasks.Task ITCID05_ThrowIfMultipleActivePromotions()
        {
            // Arrange
            // Add another active promotion
            _context.DiscountPrograms.Add(new DiscountProgram
            {
                DiscountProgramID = 3,
                DiscountProgramName = "Khuyến mãi khác",
                CreateDate = DateTime.Now,
                EndDate = DateTime.Now.AddDays(3),
                IsDelete = true
            });
            _context.DiscountPrograms.Add(new DiscountProgram
            {
                DiscountProgramID = 4,
                DiscountProgramName = "Khuyến mãi khác",
                CreateDate = DateTime.Now,
                EndDate = DateTime.Now.AddDays(3),
                IsDelete = false
            });
            _context.SaveChanges();

            // Toggle main promotion to inactive
            var promo = await _promotionRepository.GetDiscountProgramByIdAsync(3);
            promo.IsDelete = true;
            await _promotionRepository.UpdateDiscountProgramAsync(promo);

            SetupHttpContext("receptionist", 1);
            var handler = new DeactivePromotionHandler(_httpContextAccessor, _promotionRepository, _procedureRepository, _ownerRepository, _mediatorMock.Object);

            var command = new DeactivePromotionCommand(3);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG121, ex.Message);
        }
    }
}
