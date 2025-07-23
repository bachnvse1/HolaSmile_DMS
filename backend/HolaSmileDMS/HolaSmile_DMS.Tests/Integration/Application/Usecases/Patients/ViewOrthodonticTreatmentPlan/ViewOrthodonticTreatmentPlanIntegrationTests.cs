using System.Security.Claims;
using Application.Common.Mappings;
using Application.Constants;
using Application.Usecases.Patients.ViewOrthodonticTreatmentPlan;
using AutoMapper;
using HDMS_API.Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Patients;

public class ViewOrthodonticTreatmentPlanIntegrationTests
{
    private readonly DbContextOptions<ApplicationDbContext> _dbContextOptions;
    private readonly IMapper _mapper;

    public ViewOrthodonticTreatmentPlanIntegrationTests()
    {
        _dbContextOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var config = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<OrthodonticTreatmentPlanProfile>(); // Profile mapping DTO
        });
        _mapper = config.CreateMapper();
    }

    private  ViewOrthodonticTreatmentPlanHandler CreateHandler(string role, int userId)
    {
        var context = new DefaultHttpContext();
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role)
        };
        context.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"));

        var httpContextAccessor = new Mock<IHttpContextAccessor>();
        httpContextAccessor.Setup(x => x.HttpContext).Returns(context);

        var db = new ApplicationDbContext(_dbContextOptions);
    
        // IMapper (real)
        var config = new MapperConfiguration(cfg => cfg.AddProfile<OrthodonticTreatmentPlanProfile>());
        var mapper = config.CreateMapper();

        // UserCommonRepository dependencies
        var emailServiceMock = new Mock<IEmailService>();
        var memoryCache = new MemoryCache(new MemoryCacheOptions());

        var repo = new OrthodonticTreatmentPlanRepository(db, mapper);
        var userRepo = new UserCommonRepository(db, emailServiceMock.Object);

        return new ViewOrthodonticTreatmentPlanHandler(repo, httpContextAccessor.Object, userRepo);
    }

    private void SeedData()
    {
        using var context = new ApplicationDbContext(_dbContextOptions);

        // Seed users
        context.Users.AddRange(
            new User { UserID = 10, Fullname = "Patient A" , Phone = "00333538991", Username = "00333538991"},
            new User { UserID = 20, Fullname = "Dentist B", Phone = "00333538992", Username = "00333538992"},
            new User { UserID = 30, Fullname = "Creator User", Phone = "00333538993", Username = "00333538993" },
            new User { UserID = 31, Fullname = "Updater User", Phone = "00333538994", Username = "00333538994" }
        );

        // Seed patient and dentist
        context.Patients.Add(new Patient { PatientID = 101, UserID = 10 });
        context.Dentists.Add(new global::Dentist { DentistId = 201, UserId = 20 });

        // Seed orthodontic treatment plan
        context.OrthodonticTreatmentPlans.Add(new OrthodonticTreatmentPlan
        {
            PlanId = 1,
            PatientId = 101,
            DentistId = 201,
            PlanTitle = "Plan A",
            CreatedAt = DateTime.Now,
            TotalCost = 5000000,
            IsDeleted = false,
            CreatedBy = 30,
            UpdatedBy = 31
        });

        context.SaveChanges();
    }


    [Fact]
    [Trait("TestType", "Integration")]
    public async System.Threading.Tasks.Task ITCID01_Patient_View_Own_Record_Success()
    {
        SeedData();
        var handler = CreateHandler("Patient", 10);
        var command = new ViewOrthodonticTreatmentPlanCommand(1, 101);

        var result = await handler.Handle(command, default);

        Assert.NotNull(result);
        Assert.Equal("Plan A", result.PlanTitle);
    }

    [Fact]
    [Trait("TestType", "Integration")]
    public async System.Threading.Tasks.Task ITCID02_Patient_View_Other_Record_Fail()
    {
        SeedData();
        var handler = CreateHandler("Patient", 11);
        var command = new ViewOrthodonticTreatmentPlanCommand(1, 101);

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }

    [Fact]
    [Trait("TestType", "Integration")]
    public async System.Threading.Tasks.Task ITCID03_Dentist_View_Any_Record_Success()
    {
        SeedData();
        var handler = CreateHandler("Dentist", 99);
        var command = new ViewOrthodonticTreatmentPlanCommand(1, 101);

        var result = await handler.Handle(command, default);

        Assert.NotNull(result);
        Assert.Equal("Plan A", result.PlanTitle);
    }

    [Fact]
    [Trait("TestType", "Integration")]
    public async System.Threading.Tasks.Task ITCID04_Invalid_Role_Should_Throw()
    {
        SeedData();
        var handler = CreateHandler("Owner", 1);
        var command = new ViewOrthodonticTreatmentPlanCommand(1, 101);

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }

    [Fact]
    [Trait("TestType", "Integration")]
    public async System.Threading.Tasks.Task ITCID05_Record_Not_Found_Should_Throw()
    {
        SeedData();
        var handler = CreateHandler("Dentist", 99);
        var command = new ViewOrthodonticTreatmentPlanCommand(999, 101);

        var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() => handler.Handle(command, default));
        Assert.Equal(MessageConstants.MSG.MSG27, ex.Message);
    }
}
