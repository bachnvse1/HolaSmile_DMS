using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.CreateSupply;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants
{
    public class CreateSupplyHandlerIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly CreateSupplyHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ITransactionRepository _transactionRepository;

        public CreateSupplyHandlerIntegrationTests()
        {
            var services = new ServiceCollection();
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("TestDb_CreateSupply"));
            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            SeedData();

            _handler = new CreateSupplyHandler(
                _httpContextAccessor,
                new SupplyRepository(_context)
                , new TransactionRepository(_context)
            );
        }

        private void SeedData()
        {
            _context.Users.RemoveRange(_context.Users);
            _context.Supplies.RemoveRange(_context.Supplies);
            _context.SaveChanges();

            _context.Users.Add(new User
            {
                UserID = 1001,
                Username = "assistant1",
                Phone = "0999999999"
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

        [Fact(DisplayName = "[Integration - Normal] Assistant Creates Supply Successfully")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task N_Assistant_Creates_Supply_Successfully()
        {
            SetupHttpContext("assistant", 1001);

            var command = new CreateSupplyCommand
            {
                SupplyName = "Gauze",
                Unit = "Box",
                QuantityInStock = 10,
                Price = 50000,
                ExpiryDate = DateTime.Now.AddMonths(6)
            };

            var result = await _handler.Handle(command, default);

            Assert.True(result);
            var created = _context.Supplies.FirstOrDefault(s => s.Name == "Gauze");
            Assert.NotNull(created);
            Assert.Equal(10, created.QuantityInStock);
            Assert.Equal("Box", created.Unit);
        }

        [Fact(DisplayName = "[Integration - Abnormal] Non-Assistant Tries to Create Supply")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task A_NonAssistant_Tries_To_Create_Supply()
        {
            SetupHttpContext("receptionist", 1001);

            var command = new CreateSupplyCommand
            {
                SupplyName = "Gauze",
                Unit = "Box",
                QuantityInStock = 10,
                Price = 50000,
                ExpiryDate = DateTime.Now.AddMonths(6)
            };

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));
        }
    }
}
