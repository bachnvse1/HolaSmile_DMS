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

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Patients;

public class ViewListInvoiceIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly IInvoiceRepository _invoiceRepo;
    private readonly IMapper _mapper;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ViewListInvoiceIntegrationTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
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
            new User { UserID = 1, Username = "011", Fullname = "Patient A", Phone = "011" },
            new User { UserID = 2, Username = "012", Fullname = "Receptionist B", Phone = "012" },
            new User { UserID = 3, Username = "013", Fullname = "Patient A", Phone = "012" }
        );
        _context.Patients.Add(new Patient { PatientID = 1, UserID = 1 });
        _context.Patients.Add(new Patient { PatientID = 99, UserID = 3 });
        _context.Receptionists.Add(new global::Receptionist { ReceptionistId = 2, UserId = 2 });

        _context.Invoices.AddRange(
            new Invoice { InvoiceId = 201, PatientId = 1, CreatedAt = new DateTime(2024, 6, 1), IsDeleted = false },
            new Invoice { InvoiceId = 202, PatientId = 1, CreatedAt = new DateTime(2024, 7, 5), IsDeleted = false },
            new Invoice { InvoiceId = 203, PatientId = 99, CreatedAt = new DateTime(2023, 10, 1), IsDeleted = false }
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

    private ViewListInvoiceHandler CreateHandler() =>
        new ViewListInvoiceHandler(_invoiceRepo, _httpContextAccessor, _mapper);

    [Fact(DisplayName = "ITCID01 - Patient views own invoices")]
    public async System.Threading.Tasks.Task ITCID01()
    {
        SetupHttpContext("Patient", "1");
        var handler = CreateHandler();

        var result = await handler.Handle(new ViewListInvoiceCommand(), default);

        Assert.NotNull(result);
        Assert.All(result, r => Assert.Equal(1, r.PatientId));
    }

    [Fact(DisplayName = "ITCID02 - Receptionist views all invoices")]
    public async System.Threading.Tasks.Task ITCID02()
    {
        SetupHttpContext("Receptionist", "2");
        var handler = CreateHandler();

        var result = await handler.Handle(new ViewListInvoiceCommand(), default);

        Assert.Equal(3, result.Count);
    }

    [Fact(DisplayName = "ITCID03 - Receptionist filters by PatientId")]
    public async System.Threading.Tasks.Task ITCID03()
    {
        SetupHttpContext("Receptionist", "2");
        var handler = CreateHandler();

        var result = await handler.Handle(new ViewListInvoiceCommand { PatientId = 1 }, default);

        Assert.All(result, r => Assert.Equal(1, r.PatientId));
    }

    [Fact(DisplayName = "ITCID04 - Receptionist filters by date range")]
    public async System.Threading.Tasks.Task ITCID04()
    {
        SetupHttpContext("Receptionist", "2");
        var handler = CreateHandler();

        var result = await handler.Handle(new ViewListInvoiceCommand
        {
            FromDate = new DateTime(2024, 6, 1),
            ToDate = new DateTime(2024, 7, 10)
        }, default);

        Assert.All(result, r => Assert.InRange(r.CreatedAt, new DateTime(2024, 6, 1), new DateTime(2024, 7, 10)));
    }

    [Fact(DisplayName = "ITCID05 - Unauthorized role throws error")]
    public async System.Threading.Tasks.Task ITCID05()
    {
        SetupHttpContext("Dentist", "3");
        var handler = CreateHandler();

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(new ViewListInvoiceCommand(), default));

        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }
}