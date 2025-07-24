using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Patients.ViewInvoices;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Patients;

public class ViewListInvoiceHandlerTests
{
    private readonly Mock<IInvoiceRepository> _invoiceRepoMock = new();
    private readonly Mock<IHttpContextAccessor> _httpContextMock = new();
    private readonly IMapper _mapper;

    public ViewListInvoiceHandlerTests()
    {
        var config = new MapperConfiguration(cfg => cfg.CreateMap<Invoice, ViewInvoiceDto>());
        _mapper = config.CreateMapper();
    }

    private void SetupHttpContext(string? role, string? roleTableId)
    {
        var claims = new List<Claim>();
        if (!string.IsNullOrEmpty(role)) claims.Add(new Claim(ClaimTypes.Role, role));
        if (!string.IsNullOrEmpty(roleTableId)) claims.Add(new Claim("role_table_id", roleTableId));

        _httpContextMock.Setup(x => x.HttpContext).Returns(new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(claims, "mock"))
        });
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID01_Patient_View_Invoice_Success()
    {
        SetupHttpContext("Patient", "1");
        _invoiceRepoMock.Setup(x => x.GetFilteredInvoicesAsync(null, null, null, 1))
            .ReturnsAsync(new List<Invoice> { new Invoice { InvoiceId = 1, PatientId = 1 } });

        var handler = new ViewListInvoiceHandler(_invoiceRepoMock.Object, _httpContextMock.Object, _mapper);
        var result = await handler.Handle(new ViewListInvoiceCommand(), default);

        Assert.Single(result);
        Assert.Equal(1, result[0].InvoiceId);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID02_Receptionist_View_All_Success()
    {
        SetupHttpContext("Receptionist", "2");
        _invoiceRepoMock.Setup(x => x.GetFilteredInvoicesAsync(null, null, null, null))
            .ReturnsAsync(new List<Invoice> { new Invoice { InvoiceId = 2, PatientId = 1 } });

        var handler = new ViewListInvoiceHandler(_invoiceRepoMock.Object, _httpContextMock.Object, _mapper);
        var result = await handler.Handle(new ViewListInvoiceCommand(), default);

        Assert.Single(result);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID03_Receptionist_Filter_By_PatientId()
    {
        SetupHttpContext("Receptionist", "2");
        _invoiceRepoMock.Setup(x => x.GetFilteredInvoicesAsync(null, null, null, 1))
            .ReturnsAsync(new List<Invoice> { new Invoice { InvoiceId = 3, PatientId = 1 } });

        var handler = new ViewListInvoiceHandler(_invoiceRepoMock.Object, _httpContextMock.Object, _mapper);
        var result = await handler.Handle(new ViewListInvoiceCommand { PatientId = 1 }, default);

        Assert.Single(result);
        Assert.Equal(3, result[0].InvoiceId);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID04_InvalidRole_Throws()
    {
        SetupHttpContext("Dentist", "1");
        var handler = new ViewListInvoiceHandler(_invoiceRepoMock.Object, _httpContextMock.Object, _mapper);

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(new ViewListInvoiceCommand(), default));
        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID05_HttpContext_Null_Throws()
    {
        _httpContextMock.Setup(x => x.HttpContext).Returns<HttpContext>(null);
        var handler = new ViewListInvoiceHandler(_invoiceRepoMock.Object, _httpContextMock.Object, _mapper);

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(new ViewListInvoiceCommand(), default));
        Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID06_Missing_Claims_Throws()
    {
        var context = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity())
        };
        _httpContextMock.Setup(x => x.HttpContext).Returns(context);

        var handler = new ViewListInvoiceHandler(_invoiceRepoMock.Object, _httpContextMock.Object, _mapper);

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(new ViewListInvoiceCommand(), default));
        Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
    }

    [Fact]
    public async System.Threading.Tasks.Task UTCID07_Filter_By_Date()
    {
        SetupHttpContext("Receptionist", "2");
        var fromDate = new DateTime(2024, 1, 1);
        var toDate = new DateTime(2024, 12, 31);

        _invoiceRepoMock.Setup(x => x.GetFilteredInvoicesAsync(null, fromDate, toDate, null))
            .ReturnsAsync(new List<Invoice> { new Invoice { InvoiceId = 6, PatientId = 1, CreatedAt = new DateTime(2024, 6, 10) } });

        var handler = new ViewListInvoiceHandler(_invoiceRepoMock.Object, _httpContextMock.Object, _mapper);
        var result = await handler.Handle(new ViewListInvoiceCommand { FromDate = fromDate, ToDate = toDate }, default);

        Assert.Single(result);
        Assert.Equal(6, result[0].InvoiceId);
    }
}