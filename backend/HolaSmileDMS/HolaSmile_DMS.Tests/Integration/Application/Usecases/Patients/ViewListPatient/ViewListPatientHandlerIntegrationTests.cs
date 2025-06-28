using Application.Constants;
using Application.Interfaces;
using Application.Services;
using Application.Usecases.Patients.ViewListPatient;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Patients;

public class ViewListPatientHandlerIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ViewListPatientHandler _handler;

    public ViewListPatientHandlerIntegrationTests()
    {
        var services = new ServiceCollection();

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase("ViewListPatientDb"));

        services.AddHttpContextAccessor();

        var provider = services.BuildServiceProvider();

        _context = provider.GetRequiredService<ApplicationDbContext>();
        _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

        SeedData();

        var handler = new ViewListPatientHandler(
            new PatientRepository(_context),
            _httpContextAccessor,
            new Mock<IHashIdService>().Object
        );

        _handler = handler;
    }

    private void SeedData()
    {
        _context.Users.RemoveRange(_context.Users);
        _context.Patients.RemoveRange(_context.Patients);
        _context.SaveChanges();

        var user = new User
        {
            UserID = 1,
            Username = "testuser",
            Fullname = "Nguyen Van B",
            Gender = true,
            Phone = "0912345678",
            DOB = "01/01/1990",
            Email = "b@example.com",
            CreatedAt = DateTime.UtcNow
        };

        var patient = new Patient
        {
            PatientID = 10,
            UserID = 1,
            User = user
        };

        _context.Users.Add(user);
        _context.Patients.Add(patient);
        _context.SaveChanges();
    }

    private void SetupHttpContext(string role, int userId = 1)
    {
        var context = new DefaultHttpContext();
        context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role)
        }, "TestAuth"));

        _httpContextAccessor.HttpContext = context;
    }

    [Fact(DisplayName = "Normal - UTCID01 - Authorized role views patient list successfully")]
    [Trait("TestType", "Integration")]
    public async System.Threading.Tasks.Task UTCID01_ViewListPatient_Success()
    {
        SetupHttpContext("receptionist");

        var result = await _handler.Handle(new ViewListPatientCommand(), default);

        Assert.NotNull(result);
        Assert.Single(result);
        Assert.Equal("Nguyen Van B", result[0].Fullname);
    }

    [Fact(DisplayName = "Abnormal - UTCID02 - View patient list without HttpContext should throw MSG26")]
    [Trait("TestType", "Integration")]
    public async System.Threading.Tasks.Task UTCID02_ViewListPatient_NoHttpContext_Throws()
    {
        _httpContextAccessor.HttpContext = null;

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(new ViewListPatientCommand(), default));

        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }

    [Fact(DisplayName = "Abnormal - UTCID03 - View patient list with no role claim should throw MSG26")]
    [Trait("TestType", "Integration")]
    public async System.Threading.Tasks.Task UTCID03_ViewListPatient_NoRoleClaim_Throws()
    {
        var context = new DefaultHttpContext();
        context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "1")
        }, "TestAuth"));
        _httpContextAccessor.HttpContext = context;

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(new ViewListPatientCommand(), default));

        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }

    [Fact(DisplayName = "Abnormal - UTCID04 - View patient list with role Patient should throw MSG26")]
    [Trait("TestType", "Integration")]
    public async System.Threading.Tasks.Task UTCID04_ViewListPatient_ByPatientRole_Throws()
    {
        SetupHttpContext("patient");

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(new ViewListPatientCommand(), default));

        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }
}
