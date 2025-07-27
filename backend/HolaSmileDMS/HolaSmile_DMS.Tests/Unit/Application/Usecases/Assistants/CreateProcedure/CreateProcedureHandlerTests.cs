using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.ProcedureTemplate.CreateProcedure;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants;

public class CreateProcedureHandlerTests
{
    private readonly Mock<IProcedureRepository> _procedureRepoMock;
    private readonly Mock<ISupplyRepository> _supplyRepoMock;
    private readonly Mock<IOwnerRepository> _ownerRepoMock;
    private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
    private readonly Mock<IMediator> _mediatorMock;
    private readonly CreateProcedureHandler _handler;

    public CreateProcedureHandlerTests()
    {
        _procedureRepoMock = new Mock<IProcedureRepository>();
        _supplyRepoMock = new Mock<ISupplyRepository>();
        _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
        _handler = new CreateProcedureHandler(
            _procedureRepoMock.Object,
            _supplyRepoMock.Object,
            _ownerRepoMock.Object,
            _httpContextAccessorMock.Object,
            _mediatorMock.Object
        );
    }

    private void SetupHttpContext(string role, string userId)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId)
        };
        var identity = new ClaimsIdentity(claims, "mock");
        var claimsPrincipal = new ClaimsPrincipal(identity);
        var context = new DefaultHttpContext { User = claimsPrincipal };
        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);
    }

    [Fact(DisplayName = "UTCID01 - Valid input with supplies - Should return success")]
    public async System.Threading.Tasks.Task UTCID01_ValidInput_ReturnsTrue()
    {
        SetupHttpContext("assistant", "1");

        var command = new CreateProcedureCommand
        {
            ProcedureName = "Tẩy trắng răng",
            Description = "Chi tiết",
            Price = 200000,
            Discount = 10,
            OriginalPrice = 150000,
            ConsumableCost = 5000,
            ReferralCommissionRate = 5,
            DoctorCommissionRate = 5,
            AssistantCommissionRate = 5,
            TechnicianCommissionRate = 5,
            SuppliesUsed = new List<SupplyUsedDTO>
        {
            new SupplyUsedDTO { SupplyId = 1, Quantity = 2 }
        }
        };

        _supplyRepoMock.Setup(x => x.GetSupplyBySupplyIdAsync(1))
            .ReturnsAsync(new Supplies { SupplyId = 1, Price = 1000, Unit = "cái" });

        _procedureRepoMock.Setup(x => x.CreateProcedure(It.IsAny<Procedure>()))
            .ReturnsAsync(true);

        var result = await _handler.Handle(command, default);

        Assert.True(result);
        _procedureRepoMock.Verify(x => x.CreateProcedure(It.IsAny<Procedure>()), Times.Once);
    }

    [Fact(DisplayName = "UTCID02 - Supply not found - Throws exception")]
    public async System.Threading.Tasks.Task UTCID02_SupplyNotFound_ThrowsException()
    {
        SetupHttpContext("assistant", "1");

        var command = new CreateProcedureCommand
        {
            ProcedureName = "Tẩy trắng răng",
            Description = "Chi tiết",
            Price = 200000,
            Discount = 10,
            OriginalPrice = 150000,
            ConsumableCost = 5000,
            ReferralCommissionRate = 5,
            DoctorCommissionRate = 5,
            AssistantCommissionRate = 5,
            TechnicianCommissionRate = 5,
            SuppliesUsed = new List<SupplyUsedDTO>
        {
            new SupplyUsedDTO { SupplyId = 999, Quantity = 2 }
        }
        };

        _supplyRepoMock.Setup(x => x.GetSupplyBySupplyIdAsync(999)).ReturnsAsync((Supplies?)null);

        var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        Assert.Equal("Supply với ID 999 không tồn tại.", ex.Message);
    }

    [Fact(DisplayName = "UTCID03 - User not assistant - Throws unauthorized")]
    public async System.Threading.Tasks.Task UTCID03_UserNotAssistant_ThrowsUnauthorized()
    {
        SetupHttpContext("doctor", "2");

        var command = new CreateProcedureCommand();

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }

    [Theory(DisplayName = "UTCID04 - Invalid input fields - Should throw MSG95")]
    [InlineData(99, 99, -1, 0, 0, 0, 0)]
    [InlineData(99, 99, 0, -1, 0, 0, 0)]
    [InlineData(99, 99, 0, 0, -1, 0, 0)]
    [InlineData(99, 99, 0, 0, 0, -1, 0)]
    [InlineData(99, 99, 0, 0, 0, 0, -1)]
    public async System.Threading.Tasks.Task UTCID04_InvalidValues_ThrowsMSG95(
        decimal price,
        decimal originalPrice,
        decimal discount,
        decimal consumable,
        decimal referral,
        decimal doctor,
        decimal assistant)
    {
        SetupHttpContext("assistant", "1");

        var command = new CreateProcedureCommand
        {
            ProcedureName = "X",
            Price = price,
            OriginalPrice = originalPrice,
            Discount = -1,
            ConsumableCost = consumable,
            ReferralCommissionRate = -1,
            DoctorCommissionRate = -1,
            AssistantCommissionRate = -1,
            TechnicianCommissionRate = -1
        };

        var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG125, ex.Message);
    }

    [Fact(DisplayName = "UTCID05 - ProcedureName is empty - Throws MSG07")]
    public async System.Threading.Tasks.Task UTCID05_ProcedureNameEmpty_ThrowsMSG07()
    {
        SetupHttpContext("assistant", "1");

        var command = new CreateProcedureCommand
        {
            ProcedureName = "",
            Price = 100,
            OriginalPrice = 90,
            Discount = 0,
            ConsumableCost = 0,
            ReferralCommissionRate = 0,
            DoctorCommissionRate = 0,
            AssistantCommissionRate = 0,
            TechnicianCommissionRate = 0
        };

        var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
    }
}
