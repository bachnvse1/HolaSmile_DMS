using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.ProcedureTemplate.CreateProcedure;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants
{
    public class CreateProcedureHandlerTests
    {
        private readonly Mock<IProcedureRepository> _procedureRepositoryMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly CreateProcedureHandler _handler;

        public CreateProcedureHandlerTests()
        {
            _procedureRepositoryMock = new Mock<IProcedureRepository>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _handler = new CreateProcedureHandler(_procedureRepositoryMock.Object, _httpContextAccessorMock.Object);
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

        [Fact(DisplayName = "Normal - UTCID01 - Valid input should return success")]
        public async System.Threading.Tasks.Task UTCID01_ValidInput_ReturnsSuccess()
        {
            SetupHttpContext("assistant", "1");
            var command = new CreateProcedureCommand
            {
                ProcedureName = "Valid",
                Price = 100,
                Discount = 10,
                Description = "Desc",
                OriginalPrice = 90,
                ConsumableCost = 5,
                ReferralCommissionRate = 1,
                DoctorCommissionRate = 2,
                AssistantCommissionRate = 3,
                TechnicianCommissionRate = 4
            };
            _procedureRepositoryMock.Setup(r => r.CreateProcedure(It.IsAny<Procedure>())).ReturnsAsync(true);
            var result = await _handler.Handle(command, default);
            Assert.True(result);
        }

        [Fact(DisplayName = "Unauthorized - UTCID02 - User not authenticated")]
        public async System.Threading.Tasks.Task UTCID02_UserNotAuthenticated_ThrowsUnauthorized()
        {
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns((HttpContext)null);
            var command = new CreateProcedureCommand();
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
        }

        [Fact(DisplayName = "Unauthorized - UTCID03 - User is not assistant")]
        public async System.Threading.Tasks.Task UTCID03_UserIsNotAssistant_ThrowsUnauthorized()
        {
            SetupHttpContext("doctor", "1");
            var command = new CreateProcedureCommand();
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "Invalid - UTCID04 - ProcedureName is null or empty")]
        public async System.Threading.Tasks.Task UTCID04_ProcedureNameEmpty_ThrowsException()
        {
            SetupHttpContext("assistant", "1");
            var command = new CreateProcedureCommand { ProcedureName = "" };
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
        }

        [Fact(DisplayName = "Invalid - UTCID05 - Price <= 0")]
        public async System.Threading.Tasks.Task UTCID05_PriceInvalid_ThrowsException()
        {
            SetupHttpContext("assistant", "1");
            var command = new CreateProcedureCommand { ProcedureName = "A", Price = 0 };
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG95, ex.Message);
        }

        [Fact(DisplayName = "Invalid - UTCID06 - Discount < 0")]
        public async System.Threading.Tasks.Task UTCID06_DiscountNegative_ThrowsException()
        {
            SetupHttpContext("assistant", "1");
            var command = new CreateProcedureCommand { ProcedureName = "A", Price = 1, Discount = -1 };
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG95, ex.Message);
        }

        [Fact(DisplayName = "Invalid - UTCID07 - OriginalPrice <= 0")]
        public async System.Threading.Tasks.Task UTCID07_OriginalPriceInvalid_ThrowsException()
        {
            SetupHttpContext("assistant", "1");
            var command = new CreateProcedureCommand { ProcedureName = "A", Price = 1, Discount = 0, OriginalPrice = 0 };
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG95, ex.Message);
        }

        [Fact(DisplayName = "Invalid - UTCID08 - ConsumableCost < 0")]
        public async System.Threading.Tasks.Task UTCID08_ConsumableCostNegative_ThrowsException()
        {
            SetupHttpContext("assistant", "1");
            var command = new CreateProcedureCommand { ProcedureName = "A", Price = 1, Discount = 0, OriginalPrice = 1, ConsumableCost = -5 };
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG95, ex.Message);
        }

        [Fact(DisplayName = "Invalid - UTCID09 - ReferralCommissionRate < 0")]
        public async System.Threading.Tasks.Task UTCID09_ReferralCommissionNegative_ThrowsException()
        {
            SetupHttpContext("assistant", "1");
            var command = new CreateProcedureCommand { ProcedureName = "A", Price = 1, Discount = 0, OriginalPrice = 1, ConsumableCost = 1, ReferralCommissionRate = -1 };
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG95, ex.Message);
        }

        [Fact(DisplayName = "Invalid - UTCID10 - DoctorCommissionRate < 0")]
        public async System.Threading.Tasks.Task UTCID10_DoctorCommissionNegative_ThrowsException()
        {
            SetupHttpContext("assistant", "1");
            var command = new CreateProcedureCommand { ProcedureName = "A", Price = 1, Discount = 0, OriginalPrice = 1, ConsumableCost = 1, ReferralCommissionRate = 0, DoctorCommissionRate = -2 };
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG95, ex.Message);
        }

        [Fact(DisplayName = "Invalid - UTCID11 - AssistantCommissionRate < 0")]
        public async System.Threading.Tasks.Task UTCID11_AssistantCommissionNegative_ThrowsException()
        {
            SetupHttpContext("assistant", "1");
            var command = new CreateProcedureCommand { ProcedureName = "A", Price = 1, Discount = 0, OriginalPrice = 1, ConsumableCost = 1, ReferralCommissionRate = 0, DoctorCommissionRate = 0, AssistantCommissionRate = -1 };
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG95, ex.Message);
        }

        [Fact(DisplayName = "Invalid - UTCID12 - TechnicianCommissionRate < 0")]
        public async System.Threading.Tasks.Task UTCID12_TechnicianCommissionNegative_ThrowsException()
        {
            SetupHttpContext("assistant", "1");
            var command = new CreateProcedureCommand { ProcedureName = "A", Price = 1, Discount = 0, OriginalPrice = 1, ConsumableCost = 1, ReferralCommissionRate = 0, DoctorCommissionRate = 0, AssistantCommissionRate = 0, TechnicianCommissionRate = -1 };
            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG95, ex.Message);
        }
    }
}
