/*
using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.ViewListWarrantyCards;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistant
{
    public class ViewWarrantyCardHandlerTests
    {
        private readonly Mock<IWarrantyCardRepository> _repositoryMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly ViewListWarrantyCardsHandler _handler;

        public ViewWarrantyCardHandlerTests()
        {
            _repositoryMock = new Mock<IWarrantyCardRepository>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();

            _handler = new ViewListWarrantyCardsHandler(
                _repositoryMock.Object,
                _httpContextAccessorMock.Object
            );
        }

        private void SetupHttpContext(string? role)
        {
            if (role == null)
            {
                _httpContextAccessorMock.Setup(h => h.HttpContext).Returns((HttpContext?)null);
                return;
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role)
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = principal };

            _httpContextAccessorMock.Setup(h => h.HttpContext).Returns(context);
        }

        [Fact(DisplayName = "Normal - UTCID01 - Assistant can view all warranty cards with procedure info")]
        public async System.Threading.Tasks.Task UTCID01_Assistant_Can_View_Warranty_Cards()
        {
            SetupHttpContext("Assistant");

            var data = new List<WarrantyCard>
            {
                new WarrantyCard
                {
                    WarrantyCardID = 1,
                    StartDate = DateTime.Today,
                    EndDate = DateTime.Today.AddYears(1),
                    Term = "1 năm",
                    Status = true,
                    Procedures = new List<Procedure>
                    {
                        new Procedure { ProcedureId = 101, ProcedureName = "Trám răng" }
                    }
                }
            };

            _repositoryMock.Setup(r => r.GetAllWarrantyCardsWithProceduresAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(data);

            var result = await _handler.Handle(new ViewListWarrantyCardsCommand(), default);

            Assert.Single(result);
            Assert.Equal(1, result[0].WarrantyCardId);
            Assert.Equal("Trám răng", result[0].ProcedureName);
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - HttpContext is null should throw MSG53")]
        public async System.Threading.Tasks.Task UTCID02_HttpContext_Null_Should_Throw()
        {
            SetupHttpContext(null);

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new ViewListWarrantyCardsCommand(), default));

            Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Role not Assistant should throw MSG26")]
        public async System.Threading.Tasks.Task UTCID03_Not_Assistant_Should_Throw()
        {
            SetupHttpContext("Receptionist");

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new ViewListWarrantyCardsCommand(), default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "Normal - UTCID04 - Warranty card with no procedure should return 'Không xác định'")]
        public async System.Threading.Tasks.Task UTCID04_Card_With_No_Procedure_Returns_Unknown()
        {
            SetupHttpContext("Assistant");

            var data = new List<WarrantyCard>
            {
                new WarrantyCard
                {
                    WarrantyCardID = 2,
                    StartDate = DateTime.Today,
                    EndDate = DateTime.Today.AddYears(1),
                    Term = "1 năm",
                    Status = true,
                    Procedures = new List<Procedure>() // Không có procedure nào
                }
            };

            _repositoryMock.Setup(r => r.GetAllWarrantyCardsWithProceduresAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(data);

            var result = await _handler.Handle(new ViewListWarrantyCardsCommand(), default);

            Assert.Single(result);
            Assert.Equal("Không xác định", result[0].ProcedureName);
            Assert.Null(result[0].ProcedureId);
        }
    }
}
*/
