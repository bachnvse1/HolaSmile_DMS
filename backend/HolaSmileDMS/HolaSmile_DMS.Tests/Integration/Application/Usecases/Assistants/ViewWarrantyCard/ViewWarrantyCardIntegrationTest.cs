/*
using Application.Constants;
using Application.Usecases.Assistant.ViewListWarrantyCards;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using Xunit;
using Infrastructure.Repositories;
namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistant
{
    public class ViewWarrantyCardIntegrationTest
    {
        private readonly ApplicationDbContext _context;
        private readonly ViewListWarrantyCardsHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ViewWarrantyCardIntegrationTest()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("ViewWarrantyCardTestDb"));

            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();

            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            _handler = new ViewListWarrantyCardsHandler(
                new WarrantyCardRepository(_context),
                _httpContextAccessor
            );
        }

        private void ClearData()
        {
            _context.WarrantyCards.RemoveRange(_context.WarrantyCards);
            _context.Procedures.RemoveRange(_context.Procedures);
            _context.SaveChanges();
        }

        private void SetupHttpContext(string role)
        {
            var context = new DefaultHttpContext();
            context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "1"),
                new Claim(ClaimTypes.Role, role)
            }, "TestAuth"));

            _httpContextAccessor.HttpContext = context;
        }

        [Fact(DisplayName = "Normal - UTCID01 - Assistant views warranty cards successfully")]
        public async System.Threading.Tasks.Task UTCID01_Assistant_ViewWarrantyCards_Success()
        {
            ClearData();
            var procedure = new Procedure
            {
                ProcedureId = 1,
                ProcedureName = "Nhổ răng"
            };

            var warrantyCard = new WarrantyCard
            {
                WarrantyCardID = 1,
                StartDate = new DateTime(2025, 6, 1),
                EndDate = new DateTime(2025, 12, 1),
                Term = "6 tháng",
                Status = true,
                Procedures = new List<Procedure> { procedure }
            };

            _context.Procedures.Add(procedure);
            _context.WarrantyCards.Add(warrantyCard);
            _context.SaveChanges();

            SetupHttpContext("Assistant");
            var command = new ViewListWarrantyCardsCommand();

            var result = await _handler.Handle(command, default);

            Assert.Single(result);
            var card = result.First();
            Assert.Equal("Nhổ răng", card.ProcedureName);
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - Unauthorized when not logged in")]
        public async System.Threading.Tasks.Task UTCID02_ViewWarrantyCards_NoHttpContext_Throws()
        {
            _httpContextAccessor.HttpContext = null;
            var command = new ViewListWarrantyCardsCommand();

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Unauthorized when not assistant")]
        public async System.Threading.Tasks.Task UTCID03_ViewWarrantyCards_InvalidRole_Throws()
        {
            SetupHttpContext("Receptionist");
            var command = new ViewListWarrantyCardsCommand();

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "Normal - UTCID04 - Assistant views empty list when no data")]
        public async System.Threading.Tasks.Task UTCID04_ViewWarrantyCards_NoData_ReturnsEmptyList()
        {
            ClearData();

            SetupHttpContext("Assistant");
            var command = new ViewListWarrantyCardsCommand();

            var result = await _handler.Handle(command, default);

            Assert.NotNull(result);
            Assert.Empty(result);
        }

        [Fact(DisplayName = "Normal - UTCID05 - WarrantyCard without procedure returns 'Không xác định'")]
        public async System.Threading.Tasks.Task UTCID05_ViewWarrantyCards_NoProcedure_ReturnsUnknown()
        {
            ClearData();

            var warrantyCard = new WarrantyCard
            {
                WarrantyCardID = 2,
                StartDate = new DateTime(2025, 1, 1),
                EndDate = new DateTime(2025, 12, 1),
                Term = "12 tháng",
                Status = true,
                Procedures = new List<Procedure>() // Empty
            };

            _context.WarrantyCards.Add(warrantyCard);
            _context.SaveChanges();

            SetupHttpContext("Assistant");
            var command = new ViewListWarrantyCardsCommand();

            var result = await _handler.Handle(command, default);

            Assert.Single(result);
            var card = result.First();
            Assert.Equal("Không xác định", card.ProcedureName);
        }
    }
}
*/
