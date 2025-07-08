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
    private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
    private readonly UpdateProcedureHandler _handler;

    public UpdateProcedureHandlerTests()
    {
        _procedureRepoMock = new Mock<IProcedureRepository>();
        _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
        _handler = new UpdateProcedureHandler(_procedureRepoMock.Object, _httpContextAccessorMock.Object);
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

    [Fact(DisplayName = "UTCID01 - Assistant cập nhật procedure hợp lệ")]
    public async System.Threading.Tasks.Task UTCID01_UpdateValid_ReturnsTrue()
    {
        SetupHttpContext("assistant", "1");

        var command = new UpdateProcedureCommand
        {
            ProcedureId = 1,
            ProcedureName = "New Name",
            Price = 100,
            OriginalPrice = 80,
            Discount = 5,
            ConsumableCost = 10,
            ReferralCommissionRate = 5,
            DoctorCommissionRate = 5,
            AssistantCommissionRate = 5,
            TechnicianCommissionRate = 5,
            SuppliesUsed = new List<SupplyUsedDTO> { new() { SupplyId = 1, Quantity = 2 } }
        };

        _procedureRepoMock.Setup(x => x.GetProcedureByProcedureId(1)).ReturnsAsync(new Procedure());
        _procedureRepoMock.Setup(x => x.DeleteSuppliesUsed(1)).ReturnsAsync(true);
        _procedureRepoMock.Setup(x => x.CreateSupplyUsed(It.IsAny<List<SuppliesUsed>>())).ReturnsAsync(true);
        _procedureRepoMock.Setup(x => x.CreateProcedure(It.IsAny<Procedure>())).ReturnsAsync(true);
        _procedureRepoMock.Setup(x => x.UpdateProcedureAsync(It.IsAny<Procedure>())).ReturnsAsync(true);

        var result = await _handler.Handle(command, default);

        Assert.True(result);
    }

    [Fact(DisplayName = "UTCID02 - Không đăng nhập")]
    public async System.Threading.Tasks.Task UTCID02_NotLoggedIn_ThrowsUnauthorized()
    {
        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns((HttpContext)null);

        var command = new UpdateProcedureCommand();

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
    }

    [Fact(DisplayName = "UTCID03 - Không phải assistant")]
    public async System.Threading.Tasks.Task UTCID03_NotAssistant_ThrowsUnauthorized()
    {
        SetupHttpContext("owner", "1");
        var command = new UpdateProcedureCommand();

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }

    [Fact(DisplayName = "UTCID04 - Procedure không tồn tại")]
    public async System.Threading.Tasks.Task UTCID04_ProcedureNotFound_Throws()
    {
        SetupHttpContext("assistant", "1");
        var command = new UpdateProcedureCommand { ProcedureId = 1 };
        _procedureRepoMock.Setup(x => x.GetProcedureByProcedureId(1)).ReturnsAsync((Procedure)null);

        var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
    }

    [Theory(DisplayName = "UTCID05 - ProcedureName null or empty")]
    [InlineData(null)]
    [InlineData("")]
    public async System.Threading.Tasks.Task UTCID05_ProcedureNameInvalid_Throws(string name)
    {
        SetupHttpContext("assistant", "1");
        var command = new UpdateProcedureCommand { ProcedureId = 1, ProcedureName = name };
        _procedureRepoMock.Setup(x => x.GetProcedureByProcedureId(1)).ReturnsAsync(new Procedure());

        var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
    }

    [Theory(DisplayName = "UTCID06~10 - Giá trị âm/0 các field")]
    [InlineData(0, 100, 0, 0, 0)]    // Price = 0
    [InlineData(100, 0, 0, 0, 0)]    // OriginalPrice = 0
    [InlineData(100, 100, -1, 0, 0)] // Discount âm
    [InlineData(100, 100, 0, -1, 0)] // ConsumableCost âm
    [InlineData(100, 100, 0, 0, -1)] // ReferralCommissionRate âm
    public async System.Threading.Tasks.Task UTCID06To10_InvalidNumbers_Throws(decimal price, decimal original, float discount, decimal consumable, float referral)
    {
        SetupHttpContext("assistant", "1");
        var command = new UpdateProcedureCommand
        {
            ProcedureId = 1,
            ProcedureName = "A",
            Price = price,
            OriginalPrice = original,
            Discount = discount,
            ConsumableCost = consumable,
            ReferralCommissionRate = referral
        };

        _procedureRepoMock.Setup(x => x.GetProcedureByProcedureId(1)).ReturnsAsync(new Procedure());

        var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG95, ex.Message);
    }

    [Fact(DisplayName = "UTCID11 - DeleteSuppliesUsed false")]
    public async System.Threading.Tasks.Task UTCID11_DeleteSuppliesUsedFail_Throws()
    {
        SetupHttpContext("assistant", "1");
        var command = new UpdateProcedureCommand
        {
            ProcedureId = 1,
            ProcedureName = "A",
            Price = 100,
            OriginalPrice = 100,
            Discount = 0,
            ConsumableCost = 0,
            ReferralCommissionRate = 0,
            SuppliesUsed = new List<SupplyUsedDTO>()
        };

        _procedureRepoMock.Setup(x => x.GetProcedureByProcedureId(1)).ReturnsAsync(new Procedure());
        _procedureRepoMock.Setup(x => x.DeleteSuppliesUsed(1)).ReturnsAsync(false);

        var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG58, ex.Message);
    }

    [Fact(DisplayName = "UTCID12 - CreateSupplyUsed false")]
    public async System.Threading.Tasks.Task UTCID12_CreateSuppliesUsedFail_Throws()
    {
        SetupHttpContext("assistant", "1");
        var command = new UpdateProcedureCommand
        {
            ProcedureId = 1,
            ProcedureName = "A",
            Price = 100,
            OriginalPrice = 100,
            Discount = 0,
            ConsumableCost = 0,
            ReferralCommissionRate = 0,
            SuppliesUsed = new List<SupplyUsedDTO> { new() { SupplyId = 1, Quantity = 1 } }
        };

        _procedureRepoMock.Setup(x => x.GetProcedureByProcedureId(1)).ReturnsAsync(new Procedure());
        _procedureRepoMock.Setup(x => x.DeleteSuppliesUsed(1)).ReturnsAsync(true);
        _procedureRepoMock.Setup(x => x.CreateSupplyUsed(It.IsAny<List<SuppliesUsed>>())).ReturnsAsync(false);

        var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG58, ex.Message);
    }
}
