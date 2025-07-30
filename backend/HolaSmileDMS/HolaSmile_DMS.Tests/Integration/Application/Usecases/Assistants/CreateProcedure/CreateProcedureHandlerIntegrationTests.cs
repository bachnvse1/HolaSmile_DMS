using System.Security.Claims;
using Application.Interfaces;
using Application.Usecases.Assistant.ProcedureTemplate.CreateProcedure;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Infrastructure.Repositories;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants
{
    public class CreateProcedureHandlerIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly CreateProcedureHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMediator _mediator;
        private readonly Mock<IMediator> _mediatorMock;

        public CreateProcedureHandlerIntegrationTests()
        {
            _mediatorMock = new Mock<IMediator>();
            var services = new ServiceCollection();
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("TestDb_CreateProcedure"));
            services.AddHttpContextAccessor();

            services.AddSingleton<IMediator>(_mediatorMock.Object);

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();
            _mediator = provider.GetRequiredService<IMediator>();

            SeedData();

            _handler = new CreateProcedureHandler(
                new ProcedureRepository(_context),
                new SupplyRepository(_context),
                new OwnerRepository(_context),
                new UserCommonRepository(_context),
                _httpContextAccessor,
                _mediator
            );
        }

        private void SeedData()
        {
            _context.Users.RemoveRange(_context.Users);
            _context.Supplies.RemoveRange(_context.Supplies);
            _context.Procedures.RemoveRange(_context.Procedures);
            _context.SaveChanges();

            _context.Users.Add(new User
            {
                UserID = 1001,
                Username = "assistant1",
                Phone = "0999999999"
            });

            _context.Supplies.Add(new Supplies
            {
                SupplyId = 1,
                Name = "Gauze",
                Price = 50000,
                Unit = "cái"
            });

            _context.SaveChanges();
        }

        private void SetupHttpContext(string role, int userId)
        {
            var context = new DefaultHttpContext();
            context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            }, "Test"));
            _httpContextAccessor.HttpContext = context;
        }

        [Fact(DisplayName = "[Integration - Normal] Assistant Creates Procedure With Supply Successfully")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task N_Assistant_Creates_Procedure_With_Supply_Success()
        {
            SetupHttpContext("assistant", 1001);

            var command = new CreateProcedureCommand
            {
                ProcedureName = "Root Canal",
                Description = "RC Treatment",
                Discount = 0,
                WarrantyPeriod = "12 months",
                OriginalPrice = 200000,
                ConsumableCost = 100000,
                Price = 10,
                ReferralCommissionRate = 5,
                DoctorCommissionRate = 10,
                AssistantCommissionRate = 5,
                TechnicianCommissionRate = 5,
                SuppliesUsed = new List<SupplyUsedDTO>
                {
                    new SupplyUsedDTO
                    {
                        SupplyId = 1,
                        Quantity = 2
                    }
                }
            };

            var result = await _handler.Handle(command, default);

            Assert.True(result);
            var created = _context.Procedures.FirstOrDefault(p => p.ProcedureName == "Root Canal");
            Assert.NotNull(created);
            Assert.Equal(1, created.SuppliesUsed.Count);
            Assert.Equal(200000 + 100000 + 2 * 50000, created.Price);
        }

        [Fact(DisplayName = "[Integration - Abnormal] Non-Assistant Tries To Create Procedure")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_NonAssistant_Cannot_Create_Procedure()
        {
            SetupHttpContext("receptionist", 1001);

            var command = new CreateProcedureCommand
            {
                ProcedureName = "RCT",
                OriginalPrice = 100000,
                ConsumableCost = 50000,
                Price = 0,
                Discount = 0,
                ReferralCommissionRate = 5,
                DoctorCommissionRate = 10,
                AssistantCommissionRate = 5,
                TechnicianCommissionRate = 5
            };

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));
        }
    }
}
