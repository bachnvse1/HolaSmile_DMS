using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Receptionist.CreateDiscountProgram;
using Domain.Entities;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Receptionists
{
    public class CreateDiscountProgramHandlerIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly IPromotionrepository _promotionRepository;
        private readonly IProcedureRepository _procedureRepository;
        private readonly IOwnerRepository _ownerRepository;
        private readonly Mock<IMediator> _mediatorMock;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CreateDiscountProgramHandlerIntegrationTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _promotionRepository = new PromotionRepository(_context);
            _procedureRepository = new ProcedureRepository(_context);
            _ownerRepository = new OwnerRepository(_context);
            _mediatorMock = new Mock<IMediator>();

            var services = new ServiceCollection();
            services.AddMemoryCache();
            var provider = services.BuildServiceProvider();
            var memoryCache = provider.GetService<IMemoryCache>();

            _httpContextAccessor = new HttpContextAccessor
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, "1"),
                        new Claim(ClaimTypes.Role, "receptionist")
                    }, "TestAuth"))
                }
            };

            SeedData();
        }

        private void SeedData()
        {
            _context.Users.AddRange(
                new User { UserID = 1, Username = "0111111111", Fullname = "Receptionist A", Phone = "0111111111" },
                new User { UserID = 2, Username = "0111111112", Fullname = "Owner B", Phone = "0111111112" }
            );

            _context.Owners.Add(new Owner { OwnerId = 1, UserId = 2 });

            _context.Procedures.Add(new Procedure
            {
                ProcedureId = 10,
                ProcedureName = "Tẩy trắng răng",
                OriginalPrice = 1000000,
                IsDeleted = false
            });

            _context.SaveChanges();
        }

        [Fact(DisplayName = "ITCID01 - Should create discount program successfully")]
        public async System.Threading.Tasks.Task ITCID01_CreateDiscountProgram_Success()
        {
            // Arrange
            var handler = new CreateDiscountProgramHandler(
                _httpContextAccessor,
                _promotionRepository,
                _procedureRepository,
                _ownerRepository,
                _mediatorMock.Object
            );

            var command = new CreateDiscountProgramCommand
            {
                ProgramName = "Summer Discount",
                CreateDate = DateTime.Today,
                EndDate = DateTime.Today.AddDays(10),
                ListProcedure = new List<ProcedureDiscountProgramDTO>
                {
                    new ProcedureDiscountProgramDTO
                    {
                        ProcedureId = 10,
                        DiscountAmount = 15
                    }
                }
            };

            // Act
            var result = await handler.Handle(command, default);

            // Assert
            Assert.True(result);

            var program = _context.DiscountPrograms.FirstOrDefault();
            Assert.NotNull(program);
            Assert.Equal("Summer Discount", program.DiscountProgramName);

            var discount = _context.ProcedureDiscountPrograms.FirstOrDefault();
            Assert.NotNull(discount);
            Assert.Equal(10, discount.ProcedureId);
            Assert.Equal(15, discount.DiscountAmount);
        }

        [Fact(DisplayName = "ITCID02 - Should throw when role is not receptionist")]
        public async System.Threading.Tasks.Task ITCID02_InvalidRole_Throws()
        {
            _httpContextAccessor.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "1"),
                new Claim(ClaimTypes.Role, "patient")
            }, "TestAuth"));

            var handler = new CreateDiscountProgramHandler(
                _httpContextAccessor,
                _promotionRepository,
                _procedureRepository,
                _ownerRepository,
                _mediatorMock.Object
            );

            var command = new CreateDiscountProgramCommand
            {
                ProgramName = "Test",
                CreateDate = DateTime.Today,
                EndDate = DateTime.Today.AddDays(1),
                ListProcedure = new List<ProcedureDiscountProgramDTO>
                {
                    new ProcedureDiscountProgramDTO { ProcedureId = 10, DiscountAmount = 10 }
                }
            };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "ITCID03 - Should throw if ProgramName is empty")]
        public async System.Threading.Tasks.Task ITCID03_EmptyProgramName_Throws()
        {
            var handler = new CreateDiscountProgramHandler(
                _httpContextAccessor,
                _promotionRepository,
                _procedureRepository,
                _ownerRepository,
                _mediatorMock.Object
            );

            var command = new CreateDiscountProgramCommand
            {
                ProgramName = " ",
                CreateDate = DateTime.Today,
                EndDate = DateTime.Today.AddDays(1),
                ListProcedure = new List<ProcedureDiscountProgramDTO>
                {
                    new ProcedureDiscountProgramDTO { ProcedureId = 10, DiscountAmount = 10 }
                }
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
        }

        [Fact(DisplayName = "ITCID04 - Should throw if EndDate < CreateDate")]
        public async System.Threading.Tasks.Task ITCID04_EndDateBeforeCreateDate_Throws()
        {
            var handler = new CreateDiscountProgramHandler(
                _httpContextAccessor,
                _promotionRepository,
                _procedureRepository,
                _ownerRepository,
                _mediatorMock.Object
            );

            var command = new CreateDiscountProgramCommand
            {
                ProgramName = "Test",
                CreateDate = DateTime.Today,
                EndDate = DateTime.Today.AddDays(-1),
                ListProcedure = new List<ProcedureDiscountProgramDTO>
                {
                    new ProcedureDiscountProgramDTO { ProcedureId = 10, DiscountAmount = 10 }
                }
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG34, ex.Message);
        }

        [Fact(DisplayName = "ITCID05 - Should throw if no procedures selected")]
        public async System.Threading.Tasks.Task ITCID05_EmptyProcedureList_Throws()
        {
            var handler = new CreateDiscountProgramHandler(
                _httpContextAccessor,
                _promotionRepository,
                _procedureRepository,
                _ownerRepository,
                _mediatorMock.Object
            );

            var command = new CreateDiscountProgramCommand
            {
                ProgramName = "Test",
                CreateDate = DateTime.Today,
                EndDate = DateTime.Today.AddDays(1),
                ListProcedure = new List<ProcedureDiscountProgramDTO>()
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG99, ex.Message);
        }
    }
}
