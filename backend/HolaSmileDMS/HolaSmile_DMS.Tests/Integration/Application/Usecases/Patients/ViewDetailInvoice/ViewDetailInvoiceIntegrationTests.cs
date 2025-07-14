using System.Security.Claims;
using Application.Common.Mappings;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Patients.ViewInvoices;
using AutoMapper;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Patients.ViewDetailInvoice;

public class ViewDetailInvoiceIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly IInvoiceRepository _invoiceRepo;
    private readonly IMapper _mapper;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ViewDetailInvoiceIntegrationTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _invoiceRepo = new InvoiceRepository(_context);

        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingInvoice>());
        _mapper = config.CreateMapper();

        _httpContextAccessor = new HttpContextAccessor();
        SeedData();
    }

    private void SeedData()
    {
        _context.Users.AddRange(
            new User { UserID = 1, Fullname = "Patient A", Phone = "011", Username = "011" },
            new User { UserID = 2, Fullname = "Receptionist B", Phone = "012", Username = "012" },
            new User { UserID = 3, Fullname = "Patient B", Phone = "013", Username = "013" } // For PatientId = 99
        );

        _context.Patients.AddRange(
            new Patient { PatientID = 1, UserID = 1 },
            new Patient { PatientID = 99, UserID = 3 } // Needed for invoice mapping
        );

        _context.Receptionists.Add(new Receptionist { ReceptionistId = 2, UserId = 2 });

        _context.Invoices.AddRange(
            new Invoice { InvoiceId = 100, PatientId = 1, CreatedAt = DateTime.Now },
            new Invoice { InvoiceId = 101, PatientId = 99, CreatedAt = DateTime.Now }
        );

        _context.SaveChanges();
    }

    private void SetupHttpContext(string role, string roleTableId)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.Role, role),
            new Claim("role_table_id", roleTableId)
        };
        _httpContextAccessor.HttpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(claims, "mock"))
        };
    }

    private ViewDetailInvoiceHandler CreateHandler() =>
        new ViewDetailInvoiceHandler(_invoiceRepo, _httpContextAccessor, _mapper);

    [Fact(DisplayName = "ITCID01 - Patient views their own invoice")]
    public async System.Threading.Tasks.Task ITCID01()
    {
        SetupHttpContext("Patient", "1");
        var handler = CreateHandler();

        var result = await handler.Handle(new ViewDetailInvoiceCommand(100), default);
        Assert.Equal(100, result.InvoiceId);
    }

    [Fact(DisplayName = "ITCID02 - Patient tries to view another patient's invoice - forbidden")]
    public async System.Threading.Tasks.Task ITCID02()
    {
        SetupHttpContext("Patient", "1");
        var handler = CreateHandler();

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(new ViewDetailInvoiceCommand(101), default));

        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }

    [Fact(DisplayName = "ITCID03 - Receptionist views any invoice")]
    public async System.Threading.Tasks.Task ITCID03()
    {
        SetupHttpContext("Receptionist", "2");
        var handler = CreateHandler();

        var result = await handler.Handle(new ViewDetailInvoiceCommand(101), default);
        Assert.Equal(101, result.InvoiceId);
    }

    [Fact(DisplayName = "ITCID04 - Invoice does not exist")]
    public async System.Threading.Tasks.Task ITCID04()
    {
        SetupHttpContext("Receptionist", "2");
        var handler = CreateHandler();

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            handler.Handle(new ViewDetailInvoiceCommand(999), default));

        Assert.Equal(MessageConstants.MSG.MSG16, ex.Message);
    }

    [Fact(DisplayName = "ITCID05 - Invalid role tries to view invoice - forbidden")]
    public async System.Threading.Tasks.Task ITCID05()
    {
        SetupHttpContext("Assistant", "99");
        var handler = CreateHandler();

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(new ViewDetailInvoiceCommand(100), default));

        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }
}