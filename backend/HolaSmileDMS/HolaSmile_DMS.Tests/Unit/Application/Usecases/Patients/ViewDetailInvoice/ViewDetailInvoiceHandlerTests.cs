using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Patients.ViewInvoices;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Patients.ViewDetailInvoice;

public class ViewDetailInvoiceHandlerTests
{
    private readonly Mock<IInvoiceRepository> _invoiceRepoMock = new();
    private readonly Mock<IHttpContextAccessor> _httpContextMock = new();
    private readonly IMapper _mapper;

    public ViewDetailInvoiceHandlerTests()
    {
        var config = new MapperConfiguration(cfg =>
        {
            cfg.CreateMap<Invoice, ViewInvoiceDto>();
        });
        _mapper = config.CreateMapper();
    }

    private ClaimsPrincipal CreateUser(string? role, string? roleTableId)
    {
        var claims = new List<Claim>();
        if (!string.IsNullOrEmpty(role)) claims.Add(new Claim(ClaimTypes.Role, role));
        if (!string.IsNullOrEmpty(roleTableId)) claims.Add(new Claim("role_table_id", roleTableId));

        return new ClaimsPrincipal(new ClaimsIdentity(claims, "mock"));
    }

    private void SetupHttpContext(string? role, string? roleTableId)
    {
        var context = new DefaultHttpContext
        {
            User = CreateUser(role, roleTableId)
        };
        _httpContextMock.Setup(x => x.HttpContext).Returns(context);
    }

    [Fact(DisplayName = "UTCID01 - Patient views their own invoice")]
    public async System.Threading.Tasks.Task UTCID01_Patient_ViewOwnInvoice_Success()
    {
        SetupHttpContext("Patient", "5");
        _invoiceRepoMock.Setup(r => r.GetInvoiceByIdAsync(1)).ReturnsAsync(new Invoice { InvoiceId = 1, PatientId = 5 });

        var handler = new ViewDetailInvoiceHandler(_invoiceRepoMock.Object, _httpContextMock.Object, _mapper);
        var result = await handler.Handle(new ViewDetailInvoiceCommand(1), default);

        Assert.Equal(1, result.InvoiceId);
    }

    [Fact(DisplayName = "UTCID02 - Patient views another patient's invoice - forbidden")]
    public async System.Threading.Tasks.Task UTCID02_Patient_ViewOthersInvoice_Forbidden()
    {
        SetupHttpContext("Patient", "5");
        _invoiceRepoMock.Setup(r => r.GetInvoiceByIdAsync(2)).ReturnsAsync(new Invoice { InvoiceId = 2, PatientId = 9 });

        var handler = new ViewDetailInvoiceHandler(_invoiceRepoMock.Object, _httpContextMock.Object, _mapper);
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(new ViewDetailInvoiceCommand(2), default));
    }

    [Fact(DisplayName = "UTCID03 - Receptionist views any invoice")]
    public async System.Threading.Tasks.Task UTCID03_Receptionist_ViewAnyInvoice_Success()
    {
        SetupHttpContext("Receptionist", "1");
        _invoiceRepoMock.Setup(r => r.GetInvoiceByIdAsync(3)).ReturnsAsync(new Invoice { InvoiceId = 3, PatientId = 99 });

        var handler = new ViewDetailInvoiceHandler(_invoiceRepoMock.Object, _httpContextMock.Object, _mapper);
        var result = await handler.Handle(new ViewDetailInvoiceCommand(3), default);

        Assert.Equal(3, result.InvoiceId);
    }

    [Fact(DisplayName = "UTCID04 - Invoice does not exist - throws exception")]
    public async System.Threading.Tasks.Task UTCID04_InvoiceNotFound_ThrowsException()
    {
        SetupHttpContext("Patient", "5");
        _invoiceRepoMock.Setup(r => r.GetInvoiceByIdAsync(999)).ReturnsAsync((Invoice?)null);

        var handler = new ViewDetailInvoiceHandler(_invoiceRepoMock.Object, _httpContextMock.Object, _mapper);
        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(new ViewDetailInvoiceCommand(999), default));
        Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
    }

    [Fact(DisplayName = "UTCID05 - Invalid role - access denied")]
    public async System.Threading.Tasks.Task UTCID05_InvalidRole_Forbidden()
    {
        SetupHttpContext("Assistant", "1");
        _invoiceRepoMock.Setup(r => r.GetInvoiceByIdAsync(4)).ReturnsAsync(new Invoice { InvoiceId = 4, PatientId = 5 });

        var handler = new ViewDetailInvoiceHandler(_invoiceRepoMock.Object, _httpContextMock.Object, _mapper);
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(new ViewDetailInvoiceCommand(4), default));
    }

    [Fact(DisplayName = "UTCID06 - No HttpContext - unauthorized")]
    public async System.Threading.Tasks.Task UTCID06_NullHttpContext_Throws()
    {
        _httpContextMock.Setup(x => x.HttpContext).Returns<HttpContext>(null);
        var handler = new ViewDetailInvoiceHandler(_invoiceRepoMock.Object, _httpContextMock.Object, _mapper);
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(new ViewDetailInvoiceCommand(1), default));
    }

    [Fact(DisplayName = "UTCID07 - Missing claims - unauthorized")]
    public async System.Threading.Tasks.Task UTCID07_MissingClaims_Throws()
    {
        var context = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity())
        };
        _httpContextMock.Setup(x => x.HttpContext).Returns(context);

        var handler = new ViewDetailInvoiceHandler(_invoiceRepoMock.Object, _httpContextMock.Object, _mapper);
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(new ViewDetailInvoiceCommand(1), default));
    }
}