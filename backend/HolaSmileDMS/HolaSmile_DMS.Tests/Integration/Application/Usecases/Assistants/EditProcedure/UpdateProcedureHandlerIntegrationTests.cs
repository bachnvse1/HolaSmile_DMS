using System.Security.Claims;
using Application.Constants;
using Application.Usecases.Assistant.ProcedureTemplate.UpdateProcedure;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants
{
    public class UpdateProcedureHandlerIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly UpdateProcedureHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UpdateProcedureHandlerIntegrationTests()
        {
            var services = new ServiceCollection();
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("TestDb_UpdateProcedure"));

            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            SeedData();

            _handler = new UpdateProcedureHandler(
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

            _context.Procedures.Add(new Procedure
            {
                ProcedureId = 10,
                ProcedureName = "Tẩy trắng răng",
                Description = "Thẩm mỹ",
                Price = 100000,
                Discount = 0,
                OriginalPrice = 80000,
                ConsumableCost = 10000,
                WarrantyPeriod = "12 tháng",
                ReferralCommissionRate = 5,
                DoctorCommissionRate = 10,
                AssistantCommissionRate = 7,
                TechnicianCommissionRate = 3,
                CreatedBy = 1,
                CreatedAt = DateTime.UtcNow
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
        }, "TestAuth"));

            _httpContextAccessor.HttpContext = context;
        }

        private UpdateProcedureCommand ValidCommand() => new UpdateProcedureCommand
        {
            ProcedureId = 10,
            ProcedureName = "Tẩy trắng răng mới",
            Description = "Cập nhật",
            Price = 150000,
            Discount = 5,
            OriginalPrice = 120000,
            ConsumableCost = 15000,
            WarrantyPeriod = "24 tháng",
            ReferralCommissionRate = 6,
            DoctorCommissionRate = 11,
            AssistantCommissionRate = 8,
            TechnicianCommissionRate = 4
        };

        [Fact(DisplayName = "ITCID01 - Assistant updates procedure successfully")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task ITCID01_Assistant_Update_Success()
        {
            SetupHttpContext("assistant", 1);

            var result = await _handler.Handle(ValidCommand(), default);

            Assert.True(result);
            var updated = _context.Procedures.First(p => p.ProcedureId == 10);
            Assert.Equal("Tẩy trắng răng mới", updated.ProcedureName);
            Assert.Equal(1, updated.UpdatedBy);
        }

        [Fact(DisplayName = "ITCID02 - Missing authentication throws MSG53")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task ITCID02_Missing_Auth_Throws()
        {
            _httpContextAccessor.HttpContext = new DefaultHttpContext(); // no claims

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

        [Fact(DisplayName = "ITCID04 - Procedure not found throws MSG16")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task ITCID04_Procedure_NotFound_Throws()
        {
            SetupHttpContext("assistant", 1);

            var cmd = ValidCommand();
            cmd.ProcedureId = 999;

            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(cmd, default));

            Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
        }
    }
}
