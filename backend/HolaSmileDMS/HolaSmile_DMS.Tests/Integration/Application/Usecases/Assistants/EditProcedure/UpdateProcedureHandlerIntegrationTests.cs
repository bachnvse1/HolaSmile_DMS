using System.Security.Claims;
using Application.Constants;
using Application.Usecases.Assistant.ProcedureTemplate.CreateProcedure;
using Application.Usecases.Assistant.ProcedureTemplate.UpdateProcedure;
using Application.Usecases.Dentist.ManageSchedule;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants
{
    public class UpdateProcedureHandlerIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly UpdateProcedureHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMediator _mediator;

        public UpdateProcedureHandlerIntegrationTests()
        {
            var services = new ServiceCollection();
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("TestDb_UpdateProcedureWithSupplies"));

            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();
            _mediator = provider.GetRequiredService<IMediator>();

            SeedData();

            _handler = new UpdateProcedureHandler(
                new ProcedureRepository(_context),
                new SupplyRepository(_context),
                new OwnerRepository(_context),
                _httpContextAccessor,
                _mediator
            );
        }

        private void SeedData()
        {
            _context.Users.RemoveRange(_context.Users);
            _context.Procedures.RemoveRange(_context.Procedures);
            _context.Supplies.RemoveRange(_context.Supplies);
            _context.SuppliesUseds.RemoveRange(_context.SuppliesUseds);
            _context.SaveChanges();

            _context.Users.AddRange(
                new User { UserID = 1, Username = "0111111111", Fullname = "Assistant A", Phone = "0111111111" },
                new User { UserID = 2, Username = "0111111112", Fullname = "Dentist B", Phone = "0111111112" }
            );

            _context.Supplies.AddRange(
                new Supplies { SupplyId = 100, Name = "Găng tay", Unit = "cái", Price = 5000, QuantityInStock = 100 },
                new Supplies { SupplyId = 101, Name = "Thuốc", Unit = "chai", Price = 20000, QuantityInStock = 50 }
            );

            _context.Procedures.Add(new Procedure
            {
                ProcedureId = 10,
                ProcedureName = "Tẩy trắng răng",
                Price = 100000,
                Description = "Thẩm mỹ",
                Discount = 0,
                OriginalPrice = 80000,
                ConsumableCost = 10000,
                ReferralCommissionRate = 5,
                DoctorCommissionRate = 10,
                AssistantCommissionRate = 7,
                TechnicianCommissionRate = 3,
                WarrantyPeriod = "12 tháng",
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
            Description = "Mô tả mới",
            Discount = 10,
            WarrantyPeriod = "24 tháng",
            OriginalPrice = 90000,
            ConsumableCost = 5000, // + (5000 * 2 from "cái")
            Price = 10, // sẽ được tính lại
            ReferralCommissionRate = 6,
            DoctorCommissionRate = 11,
            AssistantCommissionRate = 8,
            TechnicianCommissionRate = 4,
            SuppliesUsed = new List<SupplyUsedDTO>
        {
            new SupplyUsedDTO { SupplyId = 100, Quantity = 2 }, // 5000 * 2 = 10000
            new SupplyUsedDTO { SupplyId = 101, Quantity = 1 }  // đơn vị "chai", không cộng giá
        }
        };

        [Fact(DisplayName = "ITCID01 - Assistant updates procedure with supplies successfully")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task ITCID01_Update_Procedure_With_Supplies_Success()
        {
            SetupHttpContext("assistant", 1);

            var result = await _handler.Handle(ValidCommand(), default);

            Assert.True(result);

            var updated = await _context.Procedures.FindAsync(10);
            Assert.Equal("Tẩy trắng răng mới", updated.ProcedureName);
            Assert.Equal("Mô tả mới", updated.Description);
            Assert.Equal(90000 + 5000 + 10000, updated.Price); // OriginalPrice + Consumable + (5000*2)
            Assert.Equal(90000 + 5000 + 10000 - 90000, updated.ConsumableCost); // phần tăng thêm
            Assert.Equal(1, updated.UpdatedBy);

            var suppliesUsed = _context.SuppliesUseds.Where(s => s.ProcedureId == 10).ToList();
            Assert.Equal(2, suppliesUsed.Count);
            Assert.Contains(suppliesUsed, s => s.SupplyId == 100 && s.Quantity == 2);
            Assert.Contains(suppliesUsed, s => s.SupplyId == 101 && s.Quantity == 1);
        }

        [Fact(DisplayName = "ITCID02 - Role not assistant throws MSG26")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task ITCID02_WrongRole_Throws()
        {
            SetupHttpContext("patient", 3);

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(ValidCommand(), default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "ITCID04 - Procedure not found throws MSG16")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task ITCID04_ProcedureNotFound_Throws()
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
