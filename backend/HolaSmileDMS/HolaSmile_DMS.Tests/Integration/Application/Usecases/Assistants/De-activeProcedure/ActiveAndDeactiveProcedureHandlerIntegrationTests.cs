using System.Security.Claims;
using Application.Constants;
using Application.Usecases.Assistant.DeleteAndUndeleteSupply;
using Application.Usecases.Assistant.ProcedureTemplate.ActiveAndDeactiveProcedure;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants
{
    public class ActiveAndDeactiveProcedureHandlerIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly ActiveAndDeactiveProcedureHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ActiveAndDeactiveProcedureHandlerIntegrationTests()
        {
            var services = new ServiceCollection();
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("TestDb_ActiveDeactiveProcedure"));

            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            SeedData();

            _handler = new ActiveAndDeactiveProcedureHandler(
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

            _context.Procedures.AddRange(
                new Procedure
                {
                    ProcedureId = 1,
                    ProcedureName = "Tẩy trắng răng",
                    Description = "Thẩm mỹ",
                    IsDeleted = false,
                    CreatedBy = 1,
                    CreatedAt = DateTime.UtcNow
                },
                new Procedure
                {
                    ProcedureId = 2,
                    ProcedureName = "Nhổ răng",
                    Description = "Tiểu phẫu",
                    IsDeleted = true,
                    CreatedBy = 1,
                    CreatedAt = DateTime.UtcNow
                }
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

        [Fact(DisplayName = "ITCID01 - Assistant toggles IsDeleted from false to true")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task ITCID01_Toggle_To_Deleted()
        {
            SetupHttpContext("assistant", 1);

            var result = await _handler.Handle(new ActiveAndDeactiveProcedureCommand { ProcedureId = 1 }, default);

            Assert.True(result);
            var procedure = await _context.Procedures.FindAsync(1);
            Assert.True(procedure.IsDeleted);
            Assert.Equal(1, procedure.UpdatedBy);
        }

        [Fact(DisplayName = "ITCID02 - Assistant toggles IsDeleted from true to false")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task ITCID02_Toggle_To_Active()
        {
            SetupHttpContext("assistant", 1);

            var result = await _handler.Handle(new ActiveAndDeactiveProcedureCommand { ProcedureId = 2 }, default);

            Assert.True(result);
            var procedure = await _context.Procedures.FindAsync(2);
            Assert.False(procedure.IsDeleted);
            Assert.Equal(1, procedure.UpdatedBy);
        }

        [Fact(DisplayName = "ITCID03 - Missing authentication throws MSG53")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task ITCID03_Missing_Auth_Throws()
        {
            _httpContextAccessor.HttpContext = new DefaultHttpContext(); // no claims

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new ActiveAndDeactiveProcedureCommand { ProcedureId = 1 }, default));

            Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
        }

        [Fact(DisplayName = "ITCID04 - Procedure not found throws MSG16")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task ITCID04_Procedure_NotFound_Throws()
        {
            SetupHttpContext("assistant", 1);

            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(new ActiveAndDeactiveProcedureCommand { ProcedureId = 999 }, default));

            Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
        }

        [Fact(DisplayName = "ITCID05 - Unauthorized role throws exception")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task ITCID05_WrongRole_Throws()
        {
            SetupHttpContext("dentist", 2);

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new ActiveAndDeactiveProcedureCommand { ProcedureId = 1 }, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }
    }
}
