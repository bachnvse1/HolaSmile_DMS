using System.Security.Claims;
using Application.Constants;
using Application.Usecases.Assistant.ProcedureTemplate.CreateProcedure;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants
{
    public class CreateProcedureHandlerIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly CreateProcedureHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CreateProcedureHandlerIntegrationTests()
        {
            var services = new ServiceCollection();
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("TestDb_CreateProcedure"));

            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            SeedData();

            _handler = new CreateProcedureHandler(
                new ProcedureRepository(_context),
                _httpContextAccessor
            );
        }

        private void SeedData()
        {
            _context.Users.RemoveRange(_context.Users);
            _context.Procedures.RemoveRange(_context.Procedures);
            _context.SaveChanges();

            _context.Users.AddRange(
                new User { UserID = 1, Username = "0111111111", Fullname = "Assistant A", Phone = "0111111111" },
                new User { UserID = 2, Username = "0111111112", Fullname = "Dentist B", Phone = "0111111112" }
            );
            _context.SaveChanges();
        }

        private void SetupHttpContext(string role, int userId)
        {
            var context = new DefaultHttpContext();
            context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        }, "TestAuth"));

            _httpContextAccessor.HttpContext = context;
        }

        private CreateProcedureCommand ValidCommand() => new CreateProcedureCommand
        {
            ProcedureName = "Tẩy trắng răng",
            Price = 100000,
            Description = "Thẩm mỹ",
            Discount = 0,
            WarrantyPeriod = "12 tháng",
            OriginalPrice = 80000,
            ConsumableCost = 10000,
            ReferralCommissionRate = 5,
            DoctorCommissionRate = 10,
            AssistantCommissionRate = 7,
            TechnicianCommissionRate = 3
        };

        [Fact(DisplayName = "ITCID01 - Assistant creates procedure successfully (happy path)")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task ITCID01_Assistant_Creates_Successfully()
        {
            SetupHttpContext("assistant", 1);

            var result = await _handler.Handle(ValidCommand(), default);

            Assert.True(result);
            Assert.Single(_context.Procedures);
            Assert.Equal("Tẩy trắng răng", _context.Procedures.First().ProcedureName);
            Assert.Equal(1, _context.Procedures.First().CreatedBy);
        }

        [Fact(DisplayName = "ITCID02 - Missing authentication throws MSG53")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task ITCID02_Missing_Auth_Throws()
        {
            _httpContextAccessor.HttpContext = new DefaultHttpContext(); // No claims

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(ValidCommand(), default));

            Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
        }

        [Fact(DisplayName = "ITCID03 - Non-assistant role throws MSG26")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task ITCID03_NonAssistant_Throws()
        {
            SetupHttpContext("dentist", 2);

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(ValidCommand(), default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }
    }
}
