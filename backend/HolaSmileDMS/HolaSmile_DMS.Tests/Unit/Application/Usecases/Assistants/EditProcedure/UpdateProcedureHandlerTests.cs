using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.ProcedureTemplate.CreateProcedure;
using Application.Usecases.Assistant.ProcedureTemplate.UpdateProcedure;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants;
public class UpdateProcedureHandlerTests
{
    private readonly Mock<IProcedureRepository> _procedureRepoMock;
    private readonly Mock<ISupplyRepository> _supplyRepoMock;
    private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
    private readonly UpdateProcedureHandler _handler;

    public UpdateProcedureHandlerTests()
    {
        _procedureRepoMock = new Mock<IProcedureRepository>();
        _supplyRepoMock = new Mock<ISupplyRepository>();
        _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
        _handler = new UpdateProcedureHandler(_procedureRepoMock.Object, _supplyRepoMock.Object, _httpContextAccessorMock.Object);
    }

    private void SetupHttpContext(string role = "assistant", int userId = 1)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        };

        var identity = new ClaimsIdentity(claims, "mock");
        var claimsPrincipal = new ClaimsPrincipal(identity);
        var context = new DefaultHttpContext { User = claimsPrincipal };

        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);
    }

    [Fact(DisplayName = "UTCID01 - Role is null - Throw UnauthorizedAccessException")]
    public async System.Threading.Tasks.Task UTCID01_RoleIsNull_ThrowUnauthorized()
    {
        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(new DefaultHttpContext());

        var command = new UpdateProcedureCommand();

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
    }

    [Fact(DisplayName = "UTCID02 - Role is not assistant - Throw UnauthorizedAccessException")]
    public async System.Threading.Tasks.Task UTCID02_NotAssistant_ThrowUnauthorized()
    {
        SetupHttpContext("receptionist");

        var command = new UpdateProcedureCommand();

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }

    [Fact(DisplayName = "UTCID03 - Procedure not found - Throw Exception")]
    public async System.Threading.Tasks.Task UTCID03_ProcedureNotFound_Throw()
    {
        SetupHttpContext();

        _procedureRepoMock.Setup(x => x.GetProcedureByProcedureId(It.IsAny<int>()))
                          .ReturnsAsync((Procedure)null!);

        var command = new UpdateProcedureCommand { ProcedureId = 99 };

        var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
    }

    [Fact(DisplayName = "UTCID04 - Input invalid (Price <= 0) - Throw Exception")]
    public async System.Threading.Tasks.Task UTCID04_InvalidInput_Throw()
    {
        SetupHttpContext();

        _procedureRepoMock.Setup(x => x.GetProcedureByProcedureId(It.IsAny<int>()))
                          .ReturnsAsync(new Procedure());

        var command = new UpdateProcedureCommand
        {
            ProcedureId = 1,
            ProcedureName = "Test",
            Price = 0,
            OriginalPrice = 100
        };

        var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG95, ex.Message);
    }

    [Fact(DisplayName = "UTCID05 - Supply not found - Throw Exception")]
    public async System.Threading.Tasks.Task UTCID05_SupplyNotFound_Throw()
    {
        SetupHttpContext();

        _procedureRepoMock.Setup(x => x.GetProcedureByProcedureId(1)).ReturnsAsync(new Procedure());

        _supplyRepoMock.Setup(x => x.GetSupplyBySupplyIdAsync(1)).ReturnsAsync((Supplies)null!);

        var command = new UpdateProcedureCommand
        {
            ProcedureId = 1,
            ProcedureName = "Test",
            Price = 100,
            OriginalPrice = 50,
            ConsumableCost = 10,
            Discount = 0,
            ReferralCommissionRate = 0,
            DoctorCommissionRate = 0,
            AssistantCommissionRate = 0,
            TechnicianCommissionRate = 0,
            SuppliesUsed = new List<SupplyUsedDTO>
            {
                new SupplyUsedDTO { SupplyId = 1, Quantity = 1 }
            }
        };

        var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        Assert.Equal("Supply với ID 1 không tồn tại.", ex.Message);
    }

    [Fact(DisplayName = "UTCID06 - Delete SuppliesUsed failed - Throw Exception")]
    public async System.Threading.Tasks.Task UTCID06_DeleteSuppliesFailed_Throw()
    {
        SetupHttpContext();

        _procedureRepoMock.Setup(x => x.GetProcedureByProcedureId(1)).ReturnsAsync(new Procedure());

        _supplyRepoMock.Setup(x => x.GetSupplyBySupplyIdAsync(1))
                       .ReturnsAsync(new Supplies { SupplyId = 1, Price = 100, Unit = "cái" });

        _procedureRepoMock.Setup(x => x.DeleteSuppliesUsed(1)).ReturnsAsync(false);

        var command = new UpdateProcedureCommand
        {
            ProcedureId = 1,
            ProcedureName = "Test",
            Price = 200,
            OriginalPrice = 100,
            ConsumableCost = 20,
            Discount = 5,
            ReferralCommissionRate = 5,
            DoctorCommissionRate = 5,
            AssistantCommissionRate = 5,
            TechnicianCommissionRate = 5,
            SuppliesUsed = new List<SupplyUsedDTO>
            {
                new SupplyUsedDTO { SupplyId = 1, Quantity = 2 }
            }
        };

        var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG58, ex.Message);
    }

    [Fact(DisplayName = "UTCID07 - Success with valid input")]
    public async System.Threading.Tasks.Task UTCID07_Success()
    {
        SetupHttpContext();

        _procedureRepoMock.Setup(x => x.GetProcedureByProcedureId(1)).ReturnsAsync(new Procedure());

        _supplyRepoMock.Setup(x => x.GetSupplyBySupplyIdAsync(1))
                       .ReturnsAsync(new Supplies { SupplyId = 1, Price = 100, Unit = "cái" });

        _procedureRepoMock.Setup(x => x.DeleteSuppliesUsed(1)).ReturnsAsync(true);
        _procedureRepoMock.Setup(x => x.CreateSupplyUsed(It.IsAny<List<SuppliesUsed>>())).ReturnsAsync(true);
        _procedureRepoMock.Setup(x => x.UpdateProcedureAsync(It.IsAny<Procedure>())).ReturnsAsync(true);

        var command = new UpdateProcedureCommand
        {
            ProcedureId = 1,
            ProcedureName = "Test Procedure",
            Price = 200,
            OriginalPrice = 100,
            ConsumableCost = 20,
            Discount = 5,
            WarrantyPeriod = "12 tháng",
            ReferralCommissionRate = 5,
            DoctorCommissionRate = 5,
            AssistantCommissionRate = 5,
            TechnicianCommissionRate = 5,
            SuppliesUsed = new List<SupplyUsedDTO>
            {
                new SupplyUsedDTO { SupplyId = 1, Quantity = 2 }
            }
        };

        var result = await _handler.Handle(command, default);

        Assert.True(result);
    }
}
