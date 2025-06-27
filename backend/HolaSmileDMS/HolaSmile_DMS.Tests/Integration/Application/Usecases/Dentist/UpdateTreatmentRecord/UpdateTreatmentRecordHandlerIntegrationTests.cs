using Application.Constants;
using Application.Usecases.Dentist.UpdateTreatmentRecord;
using AutoMapper;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Dentist;

public class UpdateTreatmentRecordHandlerIntegrationTests
{
    private readonly ApplicationDbContext _context;
    private readonly UpdateTreatmentRecordHandler _handler;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public UpdateTreatmentRecordHandlerIntegrationTests()
    {
        var services = new ServiceCollection();

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase("UpdateTreatmentRecordTestDb"));

        services.AddHttpContextAccessor();
        services.AddAutoMapper(typeof(UpdateTreatmentRecordHandler).Assembly); 

        var provider = services.BuildServiceProvider();
        _context = provider.GetRequiredService<ApplicationDbContext>();
        _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();
        var mapper = provider.GetRequiredService<IMapper>(); // ✅ Lấy IMapper

        SeedData();

        _handler = new UpdateTreatmentRecordHandler(
            new TreatmentRecordRepository(_context, mapper), // ✅ Truyền mapper
            _httpContextAccessor
        );
    }

    private void SeedData()
    {
        _context.Users.RemoveRange(_context.Users);
        _context.TreatmentRecords.RemoveRange(_context.TreatmentRecords);
        _context.SaveChanges();

        _context.Users.Add(new User
        {
            UserID = 10,
            Username = "dentist1",
            Fullname = "Bác sĩ A",
            Email = "d1@example.com",
            Phone = "0911111111",
            CreatedAt = DateTime.Now
        });

        _context.TreatmentRecords.Add(new TreatmentRecord
        {
            TreatmentRecordID = 1,
            ToothPosition = "R1",
            Quantity = 1,
            UnitPrice = 500000,
            TotalAmount = 500000,
            TreatmentStatus = "Initial",
            CreatedAt = DateTime.UtcNow,
            CreatedBy = 10
        });

        _context.SaveChanges();
    }

    private void SetupHttpContext(string role, int userId)
    {
        var context = new DefaultHttpContext();
        context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        }, "TestAuth"));

        _httpContextAccessor.HttpContext = context;
    }

    // ✅ UTCID01 - Dentist cập nhật thành công hồ sơ
    [Fact(DisplayName = "Normal - UTCID01 - Dentist updates treatment record successfully")]
    public async System.Threading.Tasks.Task UTCID01_Dentist_Updates_Record_Success()
    {
        SetupHttpContext("Dentist", 10);

        var command = new UpdateTreatmentRecordCommand
        {
            TreatmentRecordId = 1,
            ToothPosition = "R2",
            Quantity = 2,
            UnitPrice = 600000,
            TotalAmount = 1200000,
            TreatmentStatus = "Updated",
            Symptoms = "Pain",
            Diagnosis = "Cavity",
            TreatmentDate = new DateTime(2025, 6, 25)
        };

        var result = await _handler.Handle(command, default);

        Assert.True(result);

        var updated = await _context.TreatmentRecords.FindAsync(1);
        Assert.Equal("R2", updated!.ToothPosition);
        Assert.Equal(2, updated.Quantity);
        Assert.Equal("Updated", updated.TreatmentStatus);
    }

    // ❌ UTCID02 - Không phải Dentist
    [Fact(DisplayName = "Abnormal - UTCID02 - Non-dentist cannot update treatment record")]
    public async System.Threading.Tasks.Task UTCID02_NonDentist_Cannot_Update()
    {
        SetupHttpContext("Patient", 20); // not dentist

        var command = new UpdateTreatmentRecordCommand
        {
            TreatmentRecordId = 1,
            ToothPosition = "R2"
        };

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _handler.Handle(command, default));

        Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
    }

    // ❌ UTCID03 - Không tìm thấy TreatmentRecord
    [Fact(DisplayName = "Abnormal - UTCID03 - Record not found should throw MSG27")]
    public async System.Threading.Tasks.Task UTCID03_RecordNotFound_Throws()
    {
        SetupHttpContext("Dentist", 10);

        var command = new UpdateTreatmentRecordCommand
        {
            TreatmentRecordId = 999, // nonexistent
            ToothPosition = "L1"
        };

        var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _handler.Handle(command, default));

        Assert.Equal(MessageConstants.MSG.MSG27, ex.Message);
    }

    // ✅ UTCID04 - Dentist chỉ cập nhật một phần thông tin
    [Fact(DisplayName = "Normal - UTCID04 - Dentist partially updates treatment record successfully")]
    public async System.Threading.Tasks.Task UTCID04_Dentist_Partial_Update_Success()
    {
        SetupHttpContext("Dentist", 10);

        var command = new UpdateTreatmentRecordCommand
        {
            TreatmentRecordId = 1,
            DiscountAmount = 50000,
            TreatmentStatus = "Partial Update"
        };

        var before = await _context.TreatmentRecords.FindAsync(1);
        var originalTooth = before!.ToothPosition;
        var originalQty = before.Quantity;

        var result = await _handler.Handle(command, default);

        Assert.True(result);

        var updated = await _context.TreatmentRecords.FindAsync(1);
        Assert.Equal("Partial Update", updated!.TreatmentStatus);
        Assert.Equal(50000, updated.DiscountAmount);
        Assert.Equal(originalTooth, updated.ToothPosition); // không đổi
        Assert.Equal(originalQty, updated.Quantity); // không đổi
    }
}
