using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.Template.ProcedureTemplate.UpdateProcedure;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistant.UpdateProcedure
{
    public class UpdateProcedureHandlerTests
    {
        private readonly Mock<IProcedureRepository> _procedureRepositoryMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly UpdateProcedureHandler _handler;

        public UpdateProcedureHandlerTests()
        {
            _procedureRepositoryMock = new Mock<IProcedureRepository>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _handler = new UpdateProcedureHandler(_procedureRepositoryMock.Object, _httpContextAccessorMock.Object);
        }

        private void SetupHttpContext(string role, string userId)
        {
            var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId),
        };
            var identity = new ClaimsIdentity(claims, "mock");
            var claimsPrincipal = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = claimsPrincipal };
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);
        }

        private Procedure GetMockProcedure() => new Procedure
        {
            ProcedureId = 1,
            ProcedureName = "Test",
            Price = 100,
            OriginalPrice = 90,
            ConsumableCost = 10,
            Discount = 5,
            ReferralCommissionRate = 2,
            DoctorCommissionRate = 3,
            AssistantCommissionRate = 4,
            TechnicianCommissionRate = 1
        };

        [Fact(DisplayName = "Normal - UTCID01 - Valid update should return true")]
        public async System.Threading.Tasks.Task UTCID01_ValidUpdate_ReturnsTrue()
        {
            SetupHttpContext("assistant", "1");
            _procedureRepositoryMock.Setup(r => r.GetProcedureByProcedureId(1)).ReturnsAsync(GetMockProcedure());
            _procedureRepositoryMock.Setup(r => r.UpdateProcedureAsync(It.IsAny<Procedure>())).ReturnsAsync(true);

            var command = new UpdateProcedureCommand
            {
                ProcedureId = 1,
                ProcedureName = "Updated Name",
                Price = 200,
                OriginalPrice = 150,
                ConsumableCost = 20,
                Discount = 10,
                ReferralCommissionRate = 1,
                DoctorCommissionRate = 1,
                AssistantCommissionRate = 1,
                TechnicianCommissionRate = 1,
                Description = "New description"
            };

            var result = await _handler.Handle(command, default);
            Assert.True(result);
        }

        [Fact(DisplayName = "Unauthorized - UTCID02 - User not authenticated")]
        public async System.Threading.Tasks.Task UTCID02_UserNotAuthenticated_ThrowsUnauthorized()
        {
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns((HttpContext)null);
            var command = new UpdateProcedureCommand();
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
        }

        [Fact(DisplayName = "Unauthorized - UTCID03 - User is not assistant")]
        public async System.Threading.Tasks.Task UTCID03_UserIsNotAssistant_ThrowsUnauthorized()
        {
            SetupHttpContext("doctor", "1");
            var command = new UpdateProcedureCommand();
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "Invalid - UTCID04 - Procedure not found")]
        public async System.Threading.Tasks.Task UTCID04_ProcedureNotFound_ThrowsException()
        {
            SetupHttpContext("assistant", "1");
            _procedureRepositoryMock.Setup(r => r.GetProcedureByProcedureId(1)).ReturnsAsync((Procedure)null);

            var command = new UpdateProcedureCommand { ProcedureId = 1 };
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
        }

        [Fact(DisplayName = "Invalid - UTCID05 - ProcedureName is empty")]
        public async System.Threading.Tasks.Task UTCID05_ProcedureNameEmpty_ThrowsException()
        {
            SetupHttpContext("assistant", "1");
            _procedureRepositoryMock.Setup(r => r.GetProcedureByProcedureId(1)).ReturnsAsync(GetMockProcedure());

            var command = new UpdateProcedureCommand { ProcedureId = 1, ProcedureName = "" };
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
        }

        [Theory(DisplayName = "Invalid - UTCID06 - Price <= 0")]
        [InlineData(0)]
        public async System.Threading.Tasks.Task UTCID06_InvalidPrice_ThrowsException(decimal price)
        {
            SetupHttpContext("assistant", "1");
            _procedureRepositoryMock.Setup(r => r.GetProcedureByProcedureId(1)).ReturnsAsync(GetMockProcedure());

            var command = new UpdateProcedureCommand { ProcedureId = 1, ProcedureName = "Name", Price = price };
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG95, ex.Message);
        }

        [Fact(DisplayName = "Invalid - UTCID07 - Discount < 0")]
        public async System.Threading.Tasks.Task UTCID07_DiscountNegative_ThrowsException()
        {
            SetupHttpContext("assistant", "1");
            _procedureRepositoryMock.Setup(r => r.GetProcedureByProcedureId(1)).ReturnsAsync(GetMockProcedure());

            var command = new UpdateProcedureCommand { ProcedureId = 1, ProcedureName = "Name", Price = 1, Discount = -5 };
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG95, ex.Message);
        }

        [Fact(DisplayName = "Invalid - UTCID08 - OriginalPrice <= 0")]
        public async System.Threading.Tasks.Task UTCID08_OriginalPriceInvalid_ThrowsException()
        {
            SetupHttpContext("assistant", "1");
            _procedureRepositoryMock.Setup(r => r.GetProcedureByProcedureId(1)).ReturnsAsync(GetMockProcedure());

            var command = new UpdateProcedureCommand { ProcedureId = 1, ProcedureName = "Name", Price = 1, Discount = 0, OriginalPrice = 0 };
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG95, ex.Message);
        }

        [Fact(DisplayName = "Invalid - UTCID09 - ConsumableCost < 0")]
        public async System.Threading.Tasks.Task UTCID09_ConsumableCostNegative_ThrowsException()
        {
            SetupHttpContext("assistant", "1");
            _procedureRepositoryMock.Setup(r => r.GetProcedureByProcedureId(1)).ReturnsAsync(GetMockProcedure());

            var command = new UpdateProcedureCommand { ProcedureId = 1, ProcedureName = "Name", Price = 1, Discount = 0, OriginalPrice = 1, ConsumableCost = -1 };
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG95, ex.Message);
        }

        [Theory(DisplayName = "Invalid - UTCID10 - Commission rates < 0")]
        [InlineData(-1, 0, 0, 0)]
        public async System.Threading.Tasks.Task UTCID10_CommissionRatesNegative_ThrowsException(float refC, float docC, float asstC, float techC)
        {
            SetupHttpContext("assistant", "1");
            _procedureRepositoryMock.Setup(r => r.GetProcedureByProcedureId(1)).ReturnsAsync(GetMockProcedure());

            var command = new UpdateProcedureCommand
            {
                ProcedureId = 1,
                ProcedureName = "Name",
                Price = 1,
                Discount = 0,
                OriginalPrice = 1,
                ConsumableCost = 1,
                ReferralCommissionRate = refC,
                DoctorCommissionRate = docC,
                AssistantCommissionRate = asstC,
                TechnicianCommissionRate = techC
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG95, ex.Message);
        }
    }
}
