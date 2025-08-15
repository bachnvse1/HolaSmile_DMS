using Application.Constants;
using Application.Usecases.Owner.ViewDashboard;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Owners
{
    public class ViewDashboardIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ViewDashboardIntegrationTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase("ViewDashboardDb")
                .Options;

            _context = new ApplicationDbContext(options);
            _httpContextAccessor = new HttpContextAccessor();

            SeedTestData();
        }

        private void SetupHttpContext(string role, string userId)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, userId)
            };
            var identity = new ClaimsIdentity(claims);
            var user = new ClaimsPrincipal(identity);
            var httpContext = new DefaultHttpContext { User = user };
            _httpContextAccessor.HttpContext = httpContext;
        }
        private void SeedTestData()
        {
            _context.Database.EnsureDeleted();
            _context.Database.EnsureCreated();

            var today = DateTime.Now.Date;

            // ===== Users =====
            _context.Users.AddRange(new[]
            {
        new User { UserID = 1, Fullname = "Owner",     Username = "owner1",    Phone = "000111222", CreatedAt = today, Status = true, IsVerify = true },
        new User { UserID = 2, Fullname = "Employee 1", Username = "employee1", Phone = "000111223", CreatedAt = today, Status = true, IsVerify = true },
        new User { UserID = 3, Fullname = "Patient 1",  Username = "patient1",  Phone = "000111224", CreatedAt = today, Status = true, IsVerify = true },
        new User { UserID = 4, Fullname = "Employee 2", Username = "employee2", Phone = "000111225", CreatedAt = today, Status = true, IsVerify = true },
        new User { UserID = 5, Fullname = "Patient 2",  Username = "patient2",  Phone = "000111226", CreatedAt = today, Status = true, IsVerify = true },
         });

            // ===== Role tables =====
            // Owner
            _context.Owners.Add(new Owner { OwnerId = 1, UserId = 1 });

            // Employees (ít nhất 2 người có role != Owner/Patient)
            _context.Assistants.AddRange(new[]
            {
                new Assistant { AssistantId = 1, UserId = 2 },
            });

            // ===== Patients =====
            _context.Patients.AddRange(new[]
            {
        new Patient { PatientID = 1, UserID = 3, CreatedAt = today },
        new Patient { PatientID = 2, UserID = 5, CreatedAt = today },
            });

            // ===== Invoices =====
            _context.Invoices.AddRange(new[]
            {
        new Invoice { InvoiceId = 1, PaidAmount = 1000m, CreatedAt = today },
        new Invoice { InvoiceId = 2, PaidAmount =  500m, CreatedAt = today.AddDays(-3) },
        new Invoice { InvoiceId = 3, PaidAmount =  200m, CreatedAt = today.AddMonths(-1) },
            });

            // ===== Appointments =====
            _context.Appointments.AddRange(new[]
            {
                new Appointment {
                    AppointmentId = 1,
                    PatientId = 1,
                    DentistId = 1,              // cần có Dentist hợp lệ nếu repo join Dentist
                    Status = "Confirmed",       // trạng thái hợp lệ để repo đếm
                    IsNewPatient = true,
                    AppointmentType = "Checkup",
                    AppointmentDate = today,    // quan trọng: repo so sánh với cái này
                    AppointmentTime = new TimeSpan(9, 0, 0),
                    CreatedAt = today,
                    IsDeleted = false
                },
                new Appointment {
                    AppointmentId = 2,
                    PatientId = 2,
                    DentistId = 1,
                    Status = "Confirmed",
                    IsNewPatient = true,
                    AppointmentType = "Checkup",
                    AppointmentDate = today,
                    AppointmentTime = new TimeSpan(10, 0, 0),
                    CreatedAt = today,
                    IsDeleted = false
                },
            });
            // ===== Dentist =====
            _context.Dentists.Add(new Dentist { DentistId = 1, UserId = 4});


            _context.SaveChanges();
        }




        [Fact(DisplayName = "ITCID01 - Owner role gets dashboard (today filter)")]
            public async System.Threading.Tasks.Task ITCID01_Should_ReturnDashboardData_WhenRoleIsOwner()
        {
            // Arrange
            SetupHttpContext("Owner", "1");
            var handler = new ViewDashboardHandler(
                new InvoiceRepository(_context),
                new AppointmentRepository(_context),
                new UserCommonRepository(_context),
                new OwnerRepository(_context),
                _httpContextAccessor);

            var command = new ViewDashboardCommand { Filter = "today" };

            // Act
            var result = await handler.Handle(command, default);

            // tạm thời thêm trong test để xem output
            System.Console.WriteLine($"Rev={result.TotalRevenue}, Appt={result.TotalAppointments}, " +
                $"Patients={result.TotalPatient}, Employees={result.TotalEmployee}, NewPatients={result.NewPatient}");

            // Assert
            Assert.NotNull(result);

            // "today" chỉ tính hóa đơn hôm nay => 1000
            Assert.Equal(1000m, result.TotalRevenue);

            // 2 cuộc hẹn tạo hôm nay
            Assert.Equal(2, result.TotalAppointments);

            // Tổng bệnh nhân (lọc theo 'today' trong handler) => 2
            Assert.Equal(2, result.TotalPatient);

            // Tổng nhân viên (lọc theo 'today' + exclude owner & patients) => 2
            Assert.Equal(2, result.TotalEmployee);

            // NewPatient (lọc theo 'today') => 2
            Assert.Equal(2, result.NewPatient);
        }

        [Fact(DisplayName = "ITCID02 - Non-owner is unauthorized")]
        public async System.Threading.Tasks.Task ITCID02_Should_ThrowUnauthorized_WhenRoleIsNotOwner()
        {
            SetupHttpContext("Assistant", "2");
            var handler = new ViewDashboardHandler(
                new InvoiceRepository(_context),
                new AppointmentRepository(_context),
                new UserCommonRepository(_context),
                new OwnerRepository(_context),
                _httpContextAccessor);

            var command = new ViewDashboardCommand { Filter = "today" };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "ITCID03 - Revenue correct when filter=month")]
        public async System.Threading.Tasks.Task ITCID03_Should_CalculateTotalRevenueCorrectly_WhenFilterIsMonth()
        {
            SetupHttpContext("Owner", "1");
            var handler = new ViewDashboardHandler(
                new InvoiceRepository(_context),
                new AppointmentRepository(_context),
                new UserCommonRepository(_context),
                new OwnerRepository(_context),
                _httpContextAccessor);

            // "month" tính từ đầu tháng => gồm 1000 (hôm nay) + 500 (3 ngày trước) = 1500
            var revenue = await handler.CalculateTotalRevenue("month");

            Assert.Equal(1500m, revenue);
        }
    }
}
